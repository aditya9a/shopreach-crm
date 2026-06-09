import express from 'express';
import { getSegments, getSegmentById, createSegment, previewSegment, deleteSegment } from '../controllers/segmentController.js';

const router = express.Router();

router.get('/', getSegments);
router.post('/', createSegment);
router.post('/preview', previewSegment);
router.get('/:id', getSegmentById);
router.delete('/:id', deleteSegment);

export default router;
