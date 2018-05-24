function hsvToRgb(h, s, v) {
  let r, g, b;
  let i;
  let f, p, q, t;

  h = Math.max(0, Math.min(360, h));
  s = Math.max(0, Math.min(100, s));
  v = Math.max(0, Math.min(100, v));

  s /= 100;
  v /= 100;

  if(s === 0) {
    // Achromatic (grey)
    r = g = b = v;
    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  }

  h /= 60; // sector 0 to 5
  i = Math.floor(h);
  f = h - i; // factorial part of h
  p = v * (1 - s);
  q = v * (1 - s * f);
  t = v * (1 - s * (1 - f));

  switch(i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;

    case 1:
      r = q;
      g = v;
      b = p;
      break;

    case 2:
      r = p;
      g = v;
      b = t;
      break;

    case 3:
      r = p;
      g = q;
      b = v;
      break;

    case 4:
      r = t;
      g = p;
      b = v;
      break;

    default: // case 5:
      r = v;
      g = p;
      b = q;
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ];
}

function rgbToHsv(r, g, b) {
  let
    min = Math.min(r, g, b),
    max = Math.max(r, g, b),
    delta = max - min,
    h, s, v = max;

  v = Math.floor(max / 255 * 100);
  if ( max !== 0 )
    s = Math.floor(delta / max * 100);
  else {
    // black
    return [0, 0, 0];
  }

  if( r === max )
    h = ( g - b ) / delta;
  else if( g === max )
    h = 2 + ( b - r ) / delta;
  else
    h = 4 + ( r - g ) / delta;

  h = Math.floor(h * 60);
  if( h < 0 ) h += 360;

  return [h, s, v];
}
