// RSA Encryption/Decryption wrapper using pidCryptUtil


// Read public/private key. Key should be RSA public key (PEM) format. 
function certParser(cert){
  var lines = cert.split('\n');
  var read = false;
  var b64 = false;
  var end = false;
  var flag = '';
  var retObj = {
    info: '',
    salt: '',
    iv: null,
    b64: '',
    aes: false,
    mode: '',
    bits: 0
  };
  for (var i=0; i< lines.length; i++) {
    flag = lines[i].substr(0,9);
    if (i==1 && flag != 'Proc-Type' && flag.indexOf('M') == 0)//unencrypted cert?
      b64 = true;
    switch (flag) {
    case '-----BEGI':
      read = true;
      break;
    case '':
      if (read)
        b64 = true;
      break;
    case '-----END ':
      if (read) {
        b64 = false;
        read = false;
      }
      break;
    default:
      if (read && b64)
        retObj.b64 += pidCryptUtil.stripLineFeeds(lines[i]);
    }
  }
  return retObj;
}

// Following rsa key is generated using ssh-keygen, the private key is in
// desired format. The public key need to be dumped from private key using,
// openssl rsa -in <private-key-file> -pubout -out public.pem
var publicKey = 
"-----BEGIN PUBLIC KEY-----\n" +
"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6OQDCUi/NM12p63viyxY\n" +
"S7duH7Oox6igVLSqzdcYpIPTKUAVqLIBcVO7xSD7iqz3mrEeag+w2sZL9Aiy7jgg\n" +
"R03rcHiqJ0RIx/KCTfIDplWmcKnrbtWE9hSjkrNbw07Q+8QX/a6z4pgy6LbxkQqY\n" +
"OWXFGRa7T5X8OXWxzhBDXiLoUuXMBJxcFj5vp3f6e7OYK8YwZtBvncZwJgnImKfn\n" +
"KEy56x/iiLHntxncwcPASfZ2Yi/5nzEa5Avlp7cS410qfq7f497awgQmZQU6MJfl\n" +
"glC0NDL7pWtznQZ+buVckLsnmdW5smB+RsgNtuGEvipVPqqip5f3KXgYoKRRQaJE\n" +
"xwIDAQAB\n" +
"-----END PUBLIC KEY-----";


var privateKey =
"-----BEGIN RSA PRIVATE KEY-----\n" +
"MIIEpAIBAAKCAQEA6OQDCUi/NM12p63viyxYS7duH7Oox6igVLSqzdcYpIPTKUAV\n" +
"qLIBcVO7xSD7iqz3mrEeag+w2sZL9Aiy7jggR03rcHiqJ0RIx/KCTfIDplWmcKnr\n" +
"btWE9hSjkrNbw07Q+8QX/a6z4pgy6LbxkQqYOWXFGRa7T5X8OXWxzhBDXiLoUuXM\n" +
"BJxcFj5vp3f6e7OYK8YwZtBvncZwJgnImKfnKEy56x/iiLHntxncwcPASfZ2Yi/5\n" +
"nzEa5Avlp7cS410qfq7f497awgQmZQU6MJflglC0NDL7pWtznQZ+buVckLsnmdW5\n" +
"smB+RsgNtuGEvipVPqqip5f3KXgYoKRRQaJExwIDAQABAoIBAQCpm80+SLXADdbZ\n" +
"XYp0UDJpykgwXFaSOhOyPPWb/Yfb4Im7pAliF2mHkFTSxyeKoledWFrvIUhKvFn6\n" +
"ew9dAJE5fNz3x1kcSdW7kLknbRcNX5lcudNVn7k6wmMyZt9wiQkYIoLaZQ5q+y8w\n" +
"XnPljtK4Eo8Nq4l096V+b2Gz0hJODjg/N7rDF6TUL6zYYPxmIVgNo/eVKea3V3Q5\n" +
"l+BkRKWvKwuNgnISxSwqhNJmxZcDea5sCwJ/4insC/GHqTyYcuTIH1UDLSynY015\n" +
"e9QfhqCHupv+wTpVrlJ1wX2hBHJtrYCv464zImsN4uDTyFj8xaq6hBM/1SLHCKDz\n" +
"j6zdDsyBAoGBAP17p90lI/2hUF4ybf32dlqFf782GvWpfHooK3GpPrPcDm2RsuCn\n" +
"uENZ8rxQxLQLoHmmUwnGHjoaUJGa8AloXBOJMoT78mAD9NqS8wbnHL5ndk1SP0nX\n" +
"U9r13S3MXhpoMQn/q1sCdToXu+bjl2hlH2Y6iN6MlykEVtl8VEWWVmeHAoGBAOs0\n" +
"AtpdCR4GSV4TfelSznhvUGgTqC49etpC84rDVoDJdrmXq6rWPyIlzkYEBLUktc2s\n" +
"yfk+3cIEDRJ0e/dsQc5K5pYNnOUh0AA6GMc60BtUcQefc9+uN9H1GbBO7j4pa2Vw\n" +
"vCcHqhjvcNKpS/ve2GZ9XIPVchpd0NR9nm67LgjBAoGAApNxH0QzW256PJrSl1Qb\n" +
"28ujgrPwDjMMuskRt/P6WSWRV/e1E6dgrf6KAvPnK9U6akIQcfb7c6e0zeX/LnlL\n" +
"Bj/MraFJ00P3BwmbQqSynBS9FQgS8JMpnP4Go2KCSk5owStB+IjL3C1FkZEahssQ\n" +
"SJ+rqGdRWe9bWpZy3MosUp0CgYEAupA28x547Ofvqj+r0DdurvkcvnFZJdR+bkJN\n" +
"C/SF2QH0uqIj+Q6YZW23gLIPSeAklVBJpPrIy+yKsejTrB6i1A91d/C0UsvPQV7T\n" +
"6LQt/n+saG+Cahq3DENubPsu3v/bwEr787mQotbKl07Shqbs397wU2Irb96alvJN\n" +
"iWfPzAECgYAw6nXI5hnbC8QuxMyAzgLgDR1C6oWejVcizE6A/GAozDbSV+ZfZHoI\n" +
"LpQFtB6qxIgHlSNZrvnVlsvkiekiQOnqVLemmKhUWzsMoXDxaZGfdqg/tQeSp9fu\n" +
"FHpDxh63q8leLl2jRYSvErEURRLl20CtqweRMeO5bGxUQ/5qY7mqLw==\n" +
"-----END RSA PRIVATE KEY-----\n";

function decrypt(crypted) {
  var params = certParser(privateKey);
  if (!params.b64) {
    return null;
  }
  key = pidCryptUtil.decodeBase64(params.b64);
  var rsa = new pidCrypt.RSA();
  asn = pidCrypt.ASN1.decode(pidCryptUtil.toByteArray(key));
  tree = asn.toHexTree();
  rsa.setPrivateKeyFromASN(tree);
  crypted = pidCryptUtil.decodeBase64(pidCryptUtil.stripLineFeeds(crypted));
  return rsa.decrypt(pidCryptUtil.convertToHex(crypted));
}

function encrypt(input) {
  params = certParser(publicKey);
  if (!params.b64) {
    return null;
  }
  var key = pidCryptUtil.decodeBase64(params.b64);
  var rsa = new pidCrypt.RSA();
  var asn = pidCrypt.ASN1.decode(pidCryptUtil.toByteArray(key));
  var tree = asn.toHexTree();
  rsa.setPublicKeyFromASN(tree);
  return base64Encode(rsa.encrypt(input));
}

function base64Encode(data) {
  return pidCryptUtil.fragment(
      pidCryptUtil.encodeBase64(pidCryptUtil.convertFromHex(data)), 64);
}




