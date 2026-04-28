const express = require('express');
const router = express.Router();
const { searchPapers, savePaper, getSavedPapers, deleteSavedPaper, analyzePaper } = require('../controllers/paperController');

router.get('/search', searchPapers);
router.post('/save', savePaper);
router.get('/saved', getSavedPapers);
router.delete('/saved/:id', deleteSavedPaper);
router.post('/analyze-paper', analyzePaper);

module.exports = router;