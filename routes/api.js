const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');

// Configuración de Multer para la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /ico|png|jpg|jpeg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        } else {
            cb('Error: Solo se permiten archivos de imagen (ico, png, jpg).');
        }
    }
});

// Crear un nuevo curso y permitir la importación de datos del curso anterior
router.post('/create-course', [
    body('name').not().isEmpty(),
    body('start_date').isDate(),
    body('import_previous_course').optional().isBoolean(),
    body('previous_course_id').optional().isInt()
], (req, res) => {
    const { name, start_date, import_previous_course, previous_course_id } = req.body;

    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Comprobar si ya existe un curso abierto
    const checkQuery = 'SELECT * FROM courses WHERE is_open = TRUE';
    db.query(checkQuery, (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            return res.status(400).json({ message: 'Debe cerrar el curso actual antes de abrir uno nuevo.' });
        }

        // Crear el nuevo curso
        const query = 'INSERT INTO courses (name, start_date, is_open) VALUES (?, ?, TRUE)';
        db.query(query, [name, start_date], (err, result) => {
            if (err) throw err;
            const newCourseId = result.insertId;

            // Si el usuario desea importar datos del curso anterior
            if (import_previous_course && previous_course_id) {
                // Importar equipos
                const importTeamsQuery = `
                    INSERT INTO teams (name, description, course_id)
                    SELECT name, description, ? FROM teams WHERE course_id = ?`;
                db.query(importTeamsQuery, [newCourseId, previous_course_id], (err) => {
                    if (err) throw err;

                    // Importar otros datos (por ejemplo, informes)
                    const importReportsQuery = `
                        INSERT INTO reports (title, description, course_id, created_by)
                        SELECT title, description, ?, created_by FROM reports WHERE course_id = ?`;
                    db.query(importReportsQuery, [newCourseId, previous_course_id], (err) => {
                        if (err) throw err;

                        res.status(201).json({ message: 'Curso creado e importado exitosamente.', courseId: newCourseId });
                    });
                });
            } else {
                res.status(201).json({ message: 'Curso creado exitosamente.', courseId: newCourseId });
            }
        });
    });
});

// Cerrar y archivar el curso actual
router.post('/close-course', (req, res) => {
    // Comprobar si existe un curso abierto
    const checkQuery = 'SELECT * FROM courses WHERE is_open = TRUE';
    db.query(checkQuery, (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(400).json({ message: 'No hay un curso abierto para cerrar.' });
        }

        const courseId = results[0].id;
        const endDate = new Date().toISOString().split('T')[0];

        // Archivar el curso y marcarlo como cerrado
        const closeQuery = 'UPDATE courses SET is_open = FALSE, end_date = ?, is_archived = TRUE WHERE id = ?';
        db.query(closeQuery, [endDate, courseId], (err, result) => {
            if (err) throw err;
            res.status(200).json({ message: 'Curso cerrado y archivado exitosamente.' });
        });
    });
});

// Crear una nueva plantilla de informe
router.post('/create-report-template', [
    body('name').not().isEmpty(),
    body('template_html').not().isEmpty()
], (req, res) => {
    const { name, description, template_html, created_by } = req.body;

    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Insertar la plantilla en la base de datos
    const query = 'INSERT INTO report_templates (name, description, template_html, created_by) VALUES (?, ?, ?, ?)';
    db.query(query, [name, description, template_html, created_by], (err, result) => {
        if (err) throw err;
        res.status(201).json({ message: 'Plantilla de informe creada exitosamente.', templateId: result.insertId });
    });
});

// Generar un PDF de un informe específico usando una plantilla
router.post('/generate-report-pdf', [
    body('report_id').isInt(),
    body('template_id').isInt()
], async (req, res) => {
    const { report_id, template_id } = req.body;

    // Obtener el informe y la plantilla seleccionada
    const reportQuery = 'SELECT * FROM reports WHERE id = ?';
    const templateQuery = 'SELECT * FROM report_templates WHERE id = ?';

    db.query(reportQuery, [report_id], (err, reportResults) => {
        if (err) throw err;

        if (reportResults.length === 0) {
            return res.status(404).json({ message: 'Informe no encontrado.' });
        }

        db.query(templateQuery, [template_id], async (err, templateResults) => {
            if (err) throw err;

            if (templateResults.length === 0) {
                return res.status(404).json({ message: 'Plantilla no encontrada.' });
            }

            const report = reportResults[0];
            const template = templateResults[0];
            const templateHtml = template.template_html;

            // Renderizar el HTML con los datos del informe
            const renderedHtml = templateHtml
                .replace('{{title}}', report.title)
                .replace('{{description}}', report.description);

            // Generar PDF usando Puppeteer
            try {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.setContent(renderedHtml);
                const pdfBuffer = await page.pdf({ format: 'A4' });

                await browser.close();

                // Enviar el PDF al cliente
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="informe_${report.title}.pdf"`,
                });
                res.send(pdfBuffer);
            } catch (error) {
                console.error('Error generando el PDF:', error);
                res.status(500).json({ message: 'Error generando el PDF.' });
            }
        });
    });
});

module.exports = router;
