const jwkToPem = require('jwk-to-pem');

const jwk: any = {
    "kty": "RSA",
    "kid": "generic",
    "alg": "RS256",
    "n": "wRzo-eebJPAqYqiIuPSOym_hvXqbAPlcadhoqdNEDuVLMJTMujOsHFzIeetFyRLsT-WXIv9YRGe6DHkiMII5np-7jHl7QcAgN6d0hGVCMicrBzou0ErTG8_aJjkDSIiDPMLFKVcRwsToOIavzl6j72kVw8Yxk9w_QWwfeCZPRtcdggc6-DN8acLAU7wj4hq1KWbXvufnAzDHTIClXh6NZyBaS7VjXSmweDlv7Ph85M0DLc7b6Dg7xN1lJXMmPt7Mu8NSpnvl_ACfVmOEWtH72OTOkcfxZzZJjDZNsTrs-jmbtRYx8HhtU09ztOzt7NX7MhkTtXbUndF6pZseeDTe0qxan0kEum8IgtiQCyUCh56JNEjJCWoGSvLxsBcnEbNgNMlxZkTYq1XcgHU6aBt2XoYMiM4OyyFwUrSo7Ju6OCrsWf6rXM3ItMYzKpDeyC7GiB5we4M-z-Q4_b2AiTFfQjFhFb2JRukemPfLl9uo8GMoQvs2qqA4pHZMais-avrh",
    "e": "AQAB",
    "use": "sig"
  };
  
export const rsaPublicKey: string = jwkToPem(jwk);