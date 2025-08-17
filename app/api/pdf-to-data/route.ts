import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // APIキーのチェック
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // フォームデータからPDFファイルを取得
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'PDF file missing' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // PDFファイルをBase64に変換（OpenAI APIに送信するため）
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // OpenAI APIでPDFを直接処理（GPT-4 Visionを使用）
    // 注意：GPT-3.5では画像/PDF処理ができないため、以下の簡易的な方法を使用
    
    // 簡易的なテキスト抽出（PDFの生データから部分的にテキストを取得）
    let extractedText = '';
    const pdfString = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
    
    // PDFから基本的なテキストパターンを抽出
    const textPatterns = [
      /\((.*?)\)/g,  // 括弧内のテキスト
      /BT\s*(.*?)\s*ET/gs,  // PDFテキストブロック
    ];
    
    for (const pattern of textPatterns) {
      const matches = pdfString.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          extractedText += match[1] + ' ';
        }
      }
    }

    // テキストが取得できなかった場合は、ファイル名とサイズから仮のCSVを生成
    if (!extractedText || extractedText.trim().length < 10) {
      extractedText = `File: ${file.name}, Size: ${file.size} bytes. Please note: This PDF might be image-based or encrypted. For better results, please use a text-based PDF.`;
    }

    // テキストが長すぎる場合は制限
    const maxLength = 5000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength);
    }

    // OpenAI APIでCSVに変換
    const prompt = `You are a data extraction expert. Extract structured data from the following content and output as a valid CSV format. If the content seems to be metadata or unclear, create a simple CSV with available information. Always output valid CSV, no explanations:\n\n${extractedText}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction expert. Always output valid CSV format without any explanations.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2048,
        temperature: 0.0,
      });

      const csvContent = completion.choices[0]?.message?.content || 'Column1,Column2\nNo data,extracted';

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
      
      // OpenAI APIのエラーをより詳しく返す
      if (openaiError.error?.code === 'invalid_api_key') {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your environment variables.' },
          { status: 500 }
        );
      } else if (openaiError.error?.code === 'rate_limit_exceeded') {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        return NextResponse.json(
          { error: 'AI processing failed', details: openaiError.message },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}