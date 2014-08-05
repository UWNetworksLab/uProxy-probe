// <reference path='../freedom-typescript-api/freedom.d.ts' />
// <reference path='../freedom-typescript-api/promise.d.ts' />

interface DecryptResult {
  decrypt : { data: number[];} ;
}

declare module e2e.async {
  class Result<T> {
    addCallback(f: (T: any) => void) : void;
    addErrback(f: (T: Error) => void) : void;

    // TODO: how to replace any? static member can not reference 'T'.
    //static getValue(result: Result<T>) : T;
    static getValue(result: any) : any;
  }
}

declare module goog.storage.mechanism.HTML5LocalStorage {
  function prepareFreedom() : Promise<void>;
}

declare module e2e.openpgp {
  interface PassphraseCallbackFunc {
    (str: string, f: (passphrase: string) => void) : void;
  }

  class ContextImpl {
    setKeyRingPassphrase(passphrase: string) : void;

    importKey(passphraseCallback: PassphraseCallbackFunc,
              keyStr: string) : e2e.async.Result<string[]>;

    // We don't need to know how key is being represented, thus use any here.
    searchPublicKey(uid: string) : e2e.async.Result<any[]>;

    searchPrivateKey(uid: string) : e2e.async.Result<any[]>;

    encryptSign(plaintext: string, options: any [], keys: any [], 
                passphrase: string) : e2e.async.Result<string>;

    verifyDecrypt(passphraseCallback: any, encryptedMessage: string) :
        e2e.async.Result<DecryptResult>;
  }
}

module pgpEncrypt {
  var publicKeyStr : string = 
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' +
    'Charset: UTF-8\n' +
    '\n' +
    'xv8AAABSBFPIW9ETCCqGSM49AwEHAgMEh9yJj8tEYplKXKKiTWphXYkJEQSbm0GH\n' +
    'hy6dQOefg7/uuDMOdI2YF0NLbK+m0sL41Ewfgk/3TqVWCNdRpwgcKs3/AAAAFjxx\n' +
    'dWFudHN3b3JkQGdtYWlsLmNvbT7C/wAAAGYEEBMIABj/AAAABYJTyFvR/wAAAAmQ\n' +
    '6bggH1uHbYkAAPefAQDgx/omfDRc7hB4DT1Eong2ytygVXMIuQJmRjnKxqM61AEA\n' +
    'g5D6nKw1Woicmg7x2qfj7wU+eLlZ5UXTNqjpe8xQ4+3O/wAAAFYEU8hb0RIIKoZI\n' +
    'zj0DAQcCAwS10YFtrIWwvvLE8r32gCEtDD7Cnefkem6Tz4fDFlrdrAUNXADxGLaq\n' +
    'AQsgmceluPWjIBY7GtMvd6z/biN8YOANAwEIB8L/AAAAZgQYEwgAGP8AAAAFglPI\n' +
    'W9H/AAAACZDpuCAfW4dtiQAAegAA/RYXPbjEOHc7iy3xFxWKWPvpnPc5LwX/6DDt\n' +
    'woPMCTLeAQCpjnRiMaIK7tjslDfXd4BtaY6K90JHuRPCQUJ7Uw+fRA==\n' +
    '=3Iv4\n' +
    '-----END PGP PUBLIC KEY BLOCK-----';

  var privateKeyStr : string = 
    '-----BEGIN PGP PRIVATE KEY BLOCK-----\n' +
    'Charset: UTF-8\n' +
    'Version: End-To-End v0.3.1338\n' +
    '\n' +
    'xf8AAAB3BFPIW9ETCCqGSM49AwEHAgMEh9yJj8tEYplKXKKiTWphXYkJEQSbm0GH\n' +
    'hy6dQOefg7/uuDMOdI2YF0NLbK+m0sL41Ewfgk/3TqVWCNdRpwgcKgABAIaxz+cn\n' +
    'aR1CNIhNGoo7m0T8RycWCslolvmV6JnSFzhYDn3N/wAAABY8cXVhbnRzd29yZEBn\n' +
    'bWFpbC5jb20+wv8AAABmBBATCAAY/wAAAAWCU8hb0f8AAAAJkOm4IB9bh22JAAD3\n' +
    'nwEA4Mf6Jnw0XO4QeA09RKJ4NsrcoFVzCLkCZkY5ysajOtQBAIOQ+pysNVqInJoO\n' +
    '8dqn4+8FPni5WeVF0zao6XvMUOPtx/8AAAB7BFPIW9ESCCqGSM49AwEHAgMEtdGB\n' +
    'bayFsL7yxPK99oAhLQw+wp3n5Hpuk8+HwxZa3awFDVwA8Ri2qgELIJnHpbj1oyAW\n' +
    'OxrTL3es/24jfGDgDQMBCAcAAP40eoOaXxwE/EIXZOddFf+423N12TuuQfqPREhx\n' +
    'KOMOAg94wv8AAABmBBgTCAAY/wAAAAWCU8hb0f8AAAAJkOm4IB9bh22JAAB6AAD/\n' +
    'R8thL3J2WQsIviAWAZFaip8WCzom60sXCfb3eVC3Eg4BAMR+IehbobVWr3AEdNIj\n' +
    'MjSM+cgdhFBqQqQyxFOaX3kRxv8AAABSBFPIW9ETCCqGSM49AwEHAgMEh9yJj8tE\n' +
    'YplKXKKiTWphXYkJEQSbm0GHhy6dQOefg7/uuDMOdI2YF0NLbK+m0sL41Ewfgk/3\n' +
    'TqVWCNdRpwgcKs3/AAAAFjxxdWFudHN3b3JkQGdtYWlsLmNvbT7C/wAAAGYEEBMI\n' +
    'ABj/AAAABYJTyFvR/wAAAAmQ6bggH1uHbYkAAPefAQDgx/omfDRc7hB4DT1Eong2\n' +
    'ytygVXMIuQJmRjnKxqM61AEAg5D6nKw1Woicmg7x2qfj7wU+eLlZ5UXTNqjpe8xQ\n' +
    '4+3O/wAAAFYEU8hb0RIIKoZIzj0DAQcCAwS10YFtrIWwvvLE8r32gCEtDD7Cnefk\n' +
    'em6Tz4fDFlrdrAUNXADxGLaqAQsgmceluPWjIBY7GtMvd6z/biN8YOANAwEIB8L/\n' +
    'AAAAZgQYEwgAGP8AAAAFglPIW9H/AAAACZDpuCAfW4dtiQAAegAA/RYXPbjEOHc7\n' +
    'iy3xFxWKWPvpnPc5LwX/6DDtwoPMCTLeAQCpjnRiMaIK7tjslDfXd4BtaY6K90JH\n' +
    'uRPCQUJ7Uw+fRA==\n' +
    '=H/6h\n' +
    '-----END PGP PRIVATE KEY BLOCK-----';

  var pgpContext: e2e.openpgp.ContextImpl = new e2e.openpgp.ContextImpl();

  export function setup() : Promise<void> {
    return goog.storage.mechanism.HTML5LocalStorage.prepareFreedom().then(() => {
      // this function has the side-effect to setup the keyright storage. 
      pgpContext.setKeyRingPassphrase('');
    });
  }

  export function testKeyring() : Promise<boolean> {
    return importKey(privateKeyStr).then((keys: string[]) : Promise<any[]> => {
      return searchPrivateKey('<quantsword@gmail.com>');
    }).then((foundKeys: any[]) => {
      return foundKeys.length > 0;
    });
  }

  export function testPgpEncryption(plaintext: string) : Promise<boolean> {
    return doEncryption(plaintext)
    .then(function(result) {
        return result;
      })
    .then(doDecryption)
    .then(function(result: DecryptResult) {
        return array2str(result.decrypt.data);
      })
    .then(function(str) {
        return str == plaintext;
      });
  }

  export function importKey(keyStr: string) : Promise<string[]> {
    return new Promise(function(F, R) {
      pgpContext.importKey((str, f) => { f(''); }, keyStr).addCallback(F);
    });
  }

  export function searchPrivateKey(uid: string) : Promise<any[]> {
    return new Promise(function(F, R) {
      pgpContext.searchPrivateKey(uid).addCallback(F);
    });
  }

  export function doEncryption(plaintext: string) : Promise<string> {
    var keys = e2e.async.Result.getValue(
      pgpContext.searchPublicKey('<quantsword@gmail.com>'));
    return new Promise(function(F, R) {
        pgpContext.encryptSign(plaintext, [], keys, '').addCallback(F);
      });
  }

  export function doDecryption(ciphertext: string) : Promise<DecryptResult> {
    pgpContext.importKey((str, f) => { f(''); }, privateKeyStr);
    return new Promise(function(F, R) {
        pgpContext.verifyDecrypt(
            () => { return ''; }, // passphrase callback
            ciphertext).addCallback(F);
      });
  }

  function str2array(str: string) : number[] {
    var a: number[] = [];
    for (var i = 0; i < str.length; i++) {
      a.push(str.charCodeAt(i));
    }
    return a;
  }

  function array2str(a: number[]) : string {
    var str = '';
    for (var i = 0; i < a.length; i++) {
      str += String.fromCharCode(a[i]);
    }
    return str;
  }
}



