import fs from 'fs';

export function load({ url }) {
  const content = JSON.parse(
    // fs.readFileSync('./ocr/mrizi-i-zanave.json', 'utf-8'),
    fs.readFileSync('./ocr/kryengritja-e-shqiptareve.json', 'utf-8'),
  );

  return {
    content,
  };
}
