const encodeB64 = data => Buffer.from(data).toString('base64');
const decodeB64 = data => Buffer.from(data, 'base64').toString('ascii');

module.exports = {
  encodeB64,
  decodeB64
};