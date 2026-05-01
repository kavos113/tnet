export const serializeMermaidSvg = (svg: SVGSVGElement): string => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.removeAttribute('style');
  ensureSvgDimensions(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
};

export const svgMarkupToPngBase64 = async (
  svgMarkup: string,
  options: { backgroundColor?: string; scale?: number } = {}
): Promise<string> => {
  const image = await loadSvgImage(svgMarkup);
  const scale = Math.max(options.scale ?? window.devicePixelRatio ?? 1, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(image.naturalWidth * scale);
  canvas.height = Math.ceil(image.naturalHeight * scale);
  if (canvas.width > 32767 || canvas.height > 32767) {
    throw new Error('Diagram is too large to export as PNG.');
  }
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available.');
  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
};

const ensureSvgDimensions = (svg: SVGSVGElement): void => {
  const viewBox = svg.getAttribute('viewBox');
  if (!viewBox) return;
  const [, , width, height] = viewBox.split(/\s+/).map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;
  if (!svg.getAttribute('width') || svg.getAttribute('width') === '100%') {
    svg.setAttribute('width', String(width));
  }
  if (!svg.getAttribute('height') || svg.getAttribute('height') === '100%') {
    svg.setAttribute('height', String(height));
  }
};

const loadSvgImage = (svgMarkup: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for PNG export.'));
    };
    image.src = url;
  });
