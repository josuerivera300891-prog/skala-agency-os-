#!/usr/bin/env node

/**
 * CLI Script: Generate images using OpenRouter + Gemini
 *
 * Usage:
 *   node .agents/skills/image-generation/scripts/generate-image.js \
 *     --prompt "A beautiful sunset" \
 *     --output public/images/sunset.png \
 *     --aspect 16:9
 *
 * Requires: OPENROUTER_API_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');

// --- Parse Args ---
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
        prompt: '',
        image: '',
        output: '',
        aspect: '1:1',
        model: 'google/gemini-2.0-flash-exp',
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--prompt': parsed.prompt = args[++i] || ''; break;
            case '--image': parsed.image = args[++i] || ''; break;
            case '--output': parsed.output = args[++i] || ''; break;
            case '--aspect': parsed.aspect = args[++i] || '1:1'; break;
            case '--model': parsed.model = args[++i] || parsed.model; break;
        }
    }

    if (!parsed.prompt) {
        console.error('Error: --prompt is required');
        console.error('Usage: node generate-image.js --prompt "A beautiful sunset" [--output path.png] [--aspect 16:9]');
        process.exit(1);
    }

    return parsed;
}

// --- Load env ---
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) process.env[key] = val;
            }
        }
    }
}

// --- Main ---
async function main() {
    loadEnv();

    const args = parseArgs();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('Error: OPENROUTER_API_KEY not found in .env.local');
        process.exit(1);
    }

    console.log('Generating image...');
    console.log(`   Prompt: ${args.prompt}`);
    console.log(`   Model: ${args.model}`);
    console.log(`   Aspect: ${args.aspect}`);

    // Build content parts
    const parts = [];

    if (args.image) {
        const absPath = path.resolve(args.image);
        if (!fs.existsSync(absPath)) {
            console.error(`Error: Input image not found: ${absPath}`);
            process.exit(1);
        }
        const imageBuffer = fs.readFileSync(absPath);
        const base64 = imageBuffer.toString('base64');
        const ext = path.extname(absPath).slice(1).toLowerCase();
        const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        parts.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
        console.log(`   Input: ${absPath}`);
    }

    parts.push({
        type: 'text',
        text: args.image
            ? args.prompt
            : `Generate an image with the following description. Output ONLY the image, no text response.\n\nDescription: ${args.prompt}\n\nAspect ratio: ${args.aspect}`,
    });

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: args.model,
                messages: [{ role: 'user', content: parts }],
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error ${response.status}: ${errorText}`);
            process.exit(1);
        }

        const data = await response.json();

        // Extract image from response
        const imageBase64 = extractImage(data);
        if (!imageBase64) {
            console.error('No image returned from API');
            console.error('Response:', JSON.stringify(data).slice(0, 1000));
            process.exit(1);
        }

        // Output path
        const outputPath = args.output || `public/generated/img-${Date.now()}.png`;
        const absOutput = path.resolve(outputPath);
        const dir = path.dirname(absOutput);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Write file
        const buffer = Buffer.from(imageBase64, 'base64');
        fs.writeFileSync(absOutput, buffer);

        console.log(`Image saved: ${outputPath}`);
        console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    } catch (err) {
        console.error('Error:', err.message || err);
        process.exit(1);
    }
}

// --- Extract base64 image from response ---
function extractImage(data) {
    try {
        const choices = data.choices;
        if (!choices || !choices.length) return null;
        const content = choices[0]?.message?.content;
        if (!content) return null;

        // Array with image_url parts
        if (Array.isArray(content)) {
            for (const part of content) {
                if (part.type === 'image_url' && part.image_url?.url) {
                    const url = part.image_url.url;
                    return url.startsWith('data:') ? url.split(',')[1] : url;
                }
            }
        }

        // String with base64
        if (typeof content === 'string') {
            const b64 = content.match(/data:image\/[a-z]+;base64,([A-Za-z0-9+/=]+)/);
            if (b64) return b64[1];
            if (content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(content.trim())) return content.trim();
            const md = content.match(/!\[.*?\]\(data:image\/[a-z]+;base64,([A-Za-z0-9+/=]+)\)/);
            if (md) return md[1];
        }

        return null;
    } catch {
        return null;
    }
}

main().catch(console.error);
