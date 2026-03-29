import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const result = await base44.integrations.Core.GenerateImage({
      prompt: "Modern geometric logo for FloraSonics app: stylized leaf shape transforming into sound wave visualization. Design uses clean lines and bold geometric forms - a single leaf silhouette that morphs into concentric sound wave rings. Vibrant green gradient (bright lime to deep forest green). Minimalist, professional, tech-forward aesthetic. High contrast, striking visual impact. Suitable for app icon and branding. Square format, transparent background.",
    });

    return Response.json({ url: result.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});