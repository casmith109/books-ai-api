import {submitPrompt} from '../services/ai.service';
import type { Request, Response } from 'express';
    
export const createBook = async (req: Request, res: Response) => {
    const prompt = req.body.prompt;
    const data = await submitPrompt(prompt);
    
    res.json({data});
}

