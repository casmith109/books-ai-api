import {Router} from 'express';

const r = Router();

r.get('/health', (req, res) => {
  res.json({status: 'Healthy'});
});

export default r;