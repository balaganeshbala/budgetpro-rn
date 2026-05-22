import * as ExpoCrypto from 'expo-crypto';

const subtle = {
  async digest(algorithm, data) {
    if (algorithm !== 'SHA-256') throw new Error(`Unsupported algorithm: ${algorithm}`);
    const str = new TextDecoder().decode(new Uint8Array(data));
    const hex = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      str,
      { encoding: ExpoCrypto.CryptoEncoding.HEX }
    );
    const bytes = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
    return bytes.buffer;
  },
};

function getRandomValues(typedArray) {
  const random = ExpoCrypto.getRandomBytes(typedArray.length);
  typedArray.set(random);
  return typedArray;
}

// Force-override: don't trust partial native implementations (e.g. Hermes with broken subtle)
if (typeof crypto === 'undefined') {
  global.crypto = { subtle, getRandomValues };
} else {
  global.crypto.subtle = subtle;
  global.crypto.getRandomValues = getRandomValues;
}
