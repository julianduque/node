'use strict';
var common = require('../common');
var assert = require('assert');

if (!common.hasCrypto) {
  common.skip('missing crypto');
  return;
}
var crypto = require('crypto');

function testCipher1(key, iv) {
  // Test encyrption and decryption with explicit key and iv
  var plain =
      '32|RmVZZkFUVmpRRkp0TmJaUm56ZU9qcnJkaXNNWVNpTTU*|iXmckfRWZBGWWELw' +
      'eCBsThSsfUHLeRe0KCsK8ooHgxie0zOINpXxfZi/oNG7uq9JWFVCk70gfzQH8ZUJ' +
      'jAfaFg**';
  var cipher = crypto.createCipheriv('des-ede3-cbc', key, iv);
  var ciph = cipher.update(plain, 'utf8', 'hex');
  ciph += cipher.final('hex');

  var decipher = crypto.createDecipheriv('des-ede3-cbc', key, iv);
  var txt = decipher.update(ciph, 'hex', 'utf8');
  txt += decipher.final('utf8');

  assert.strictEqual(txt, plain, 'encryption and decryption with key and iv');

  // streaming cipher interface
  // NB: In real life, it's not guaranteed that you can get all of it
  // in a single read() like this.  But in this case, we know it's
  // quite small, so there's no harm.
  var cStream = crypto.createCipheriv('des-ede3-cbc', key, iv);
  cStream.end(plain);
  ciph = cStream.read();

  var dStream = crypto.createDecipheriv('des-ede3-cbc', key, iv);
  dStream.end(ciph);
  txt = dStream.read().toString('utf8');

  assert.strictEqual(txt, plain, 'streaming cipher iv');
}


function testCipher2(key, iv) {
  // Test encyrption and decryption with explicit key and iv
  var plain =
      '32|RmVZZkFUVmpRRkp0TmJaUm56ZU9qcnJkaXNNWVNpTTU*|iXmckfRWZBGWWELw' +
      'eCBsThSsfUHLeRe0KCsK8ooHgxie0zOINpXxfZi/oNG7uq9JWFVCk70gfzQH8ZUJ' +
      'jAfaFg**';
  var cipher = crypto.createCipheriv('des-ede3-cbc', key, iv);
  var ciph = cipher.update(plain, 'utf8', 'buffer');
  ciph = Buffer.concat([ciph, cipher.final('buffer')]);

  var decipher = crypto.createDecipheriv('des-ede3-cbc', key, iv);
  var txt = decipher.update(ciph, 'buffer', 'utf8');
  txt += decipher.final('utf8');

  assert.strictEqual(txt, plain, 'encryption and decryption with key and iv');
}

testCipher1('0123456789abcd0123456789', '12345678');
testCipher1('0123456789abcd0123456789', Buffer.from('12345678'));
testCipher1(Buffer.from('0123456789abcd0123456789'), '12345678');
testCipher1(Buffer.from('0123456789abcd0123456789'), Buffer.from('12345678'));
testCipher2(Buffer.from('0123456789abcd0123456789'), Buffer.from('12345678'));

// Zero-sized IV should be accepted in ECB mode.
crypto.createCipheriv('aes-128-ecb', Buffer.alloc(16), Buffer.alloc(0));

// But non-empty IVs should be rejected.
for (let n = 1; n < 256; n += 1) {
  assert.throws(
      () => crypto.createCipheriv('aes-128-ecb', Buffer.alloc(16),
                                  Buffer.alloc(n)),
      /Invalid IV length/);
}

// Correctly sized IV should be accepted in CBC mode.
crypto.createCipheriv('aes-128-cbc', Buffer.alloc(16), Buffer.alloc(16));

// But all other IV lengths should be rejected.
for (let n = 0; n < 256; n += 1) {
  if (n === 16) continue;
  assert.throws(
      () => crypto.createCipheriv('aes-128-cbc', Buffer.alloc(16),
                                  Buffer.alloc(n)),
      /Invalid IV length/);
}

// Zero-sized IV should be rejected in GCM mode.
assert.throws(
    () => crypto.createCipheriv('aes-128-gcm', Buffer.alloc(16),
                                Buffer.alloc(0)),
    /Invalid IV length/);

// But all other IV lengths should be accepted.
for (let n = 1; n < 256; n += 1) {
  if (common.hasFipsCrypto && n < 12) continue;
  crypto.createCipheriv('aes-128-gcm', Buffer.alloc(16), Buffer.alloc(n));
}
