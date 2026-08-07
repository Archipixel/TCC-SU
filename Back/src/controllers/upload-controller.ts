import { Request, Response } from "express";

export function handleUploadImageController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: "Nenhum arquivo de imagem foi enviado.",
      });
    }

    const host = req.get("host") || "localhost:3001";
    const protocol = req.protocol || "http";
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    return res.status(201).json({
      success: true,
      message: "Imagem enviada com sucesso.",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fullUrl,
        relativeUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro interno ao processar upload da imagem.",
    });
  }
}
