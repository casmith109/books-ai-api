import {Router} from 'express';
import {createBook} from '../controllers/book.controller';

const r = Router();

r.get('/health', (req, res) => {
  res.json({status: 'Healthy'});
});

r.post('/create-book', createBook);

export default r;