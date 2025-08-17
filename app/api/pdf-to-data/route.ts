import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // フォームデータからPDFファイルを取得
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'PDF file missing' },
        { status: 400 }
      );
    }

    // PDFファイルをBufferに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // PDFからテキストを抽出
    let extractedText = '';
    try {
      // pdf-parseを動的インポート（ビルドエラー回避）
      const pdf = await import('pdf-parse');
      const data = await pdf.default(buffer);
      extractedText = data.text;
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json(
        { error: 'Failed to parse PDF' },
        { status: 500 }
      );
    }

    // テキストが長すぎる場合は制限（トークン制限対策）
    const maxLength = 5000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength);
    }

    // OpenAI APIでCSVに変換
    const prompt = `Extract all tables and key fields from the following PDF text, and output as valid CSV. No explanation, just CSV:\n\n${extractedText}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0.0,
      });

      const csvContent = completion.choices[0]?.message?.content || '';

      // CSVをレスポンスとして返す
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="data.csv"',
        },
      });
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { error: 'AI processing failed', details: openaiError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}

// ファイルサイズ制限の設定（10MB）
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};