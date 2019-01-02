(function(window, document) {

	var url = localStorage.website || window.jqzw_serverUrl || '';
	var login_path = '/jqzw/login';
	var logout_path = '/jqzw/logout';
	var server_path = '/jqzw/server';
	var success = 'success';
	var error = 'error';
	var unlogin = 'unlogin';
	var link_error = 'link_error';
	var unLoginHandle = window.unLoginHandle || function(){console.log('goto login')};
	
	
	$jqzw_config = {
		setUrl:function(value){
			url=value;
		},
		setUnLoginHandle:function(fun){
			unLoginHandle = fun;
		}
	};

	$jqzw_server = {
		logout:function(){
			var rhr = {};
			var rhd = httpRequestCall({},url+logout_path);
			rhr.success = function(sfun){
				rhd.resultThen(success,function(result){
					sfun(result);
				});
				return rhr;
			};
			rhr.error = function(efun){
				rhd.resultThen(error,function(result){
					efun(result);
				});
				return rhr;
			};
			return rhr;
		},
		login : function(info) {
			info.password = jqzw_hex_md5(info.password);
			var rhr = {};
			var rhd = httpRequestCall(info, url+login_path);
			rhr.success = function(sfun){
				rhd.resultThen(success,function(result){
					sfun(result);
				});
				return rhr;
			};
			rhr.error = function(efun){
				rhd.resultThen(error,function(result){
					efun(result);
				});
				return rhr;
			};
			return rhr;
		},
		callServer : function() {
			var rhr = {};
			var param = {};
			param.service=arguments[0];
			param.method=arguments[1];
			param.params = new Array(arguments.length-2);
			if(arguments.length>2){
				for(var i=2;i<arguments.length;i++){
					if(arguments[i] instanceof $jqzw_server.Files){
						param.params[i-2] = 'clientFile';
						param.files=arguments[i];
					}else{
						param.params[i-2]=arguments[i];
					}
				}
			}
			var rhd = httpRequestCall(param, url+server_path);
			rhr.success = function(sfun){
				rhd.resultThen(success,function(result){
					sfun(result);
				});
				return rhr;
			};
			rhr.error = function(efun){
				rhd.resultThen(error,function(result){
					efun(result);
				});
				return rhr;
			};
			rhr.unlogin = function(ulfun){
				rhd.resultThen(unlogin,function(result){
					ulfun(result);
				});
				return rhr;
			};
			rhr.unlogin(unLoginHandle);
			return rhr;
		},
		buildParams: function() {
			var param = parsePrams(arguments);
			var pstr = null;
			for ( var key in param) {
				if (!(param[key] instanceof Function)) {
					pstr = pstr ? pstr + '&' : '';
					pstr = pstr + key + '=' + encodeURIComponent(warpString(param[key]));
				}
			}
			return pstr;
		},
		syncCallServer : function(params, error, success, unlogin) {//不支持传文件
			var request = creatHttpRequest();
			request.open('POST', url+server_path, false);
			request.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
			request.send(params);
			if(request.status==200){
				try{
					var jr =JSON.parse(request.responseText);
					if(jr.type==='success' && typeof success === 'function') {
						success(jr.value);
					} else if(jr.type==='unlogin') {
						if(typeof unlogin === 'function') {
							unlogin(jr.value);
						} else {
							unLoginHandle();
						}
					} else {
						error(request.responseText);
					}
				}catch(e){
					error(e);
					console.log(e);
				}
			}else{
				error(request.responseText);
			}
		},
		Files:function(contentType){
			var files = {};
			var contentType = contentType;
			this.getFiles = function(){
				return files;
			}
			this.getFile = function(filename){
				return files[filename];
			}
			this.append = function(filename,file){
				if(filename==null||filename==''){
					throw new error("filename can't null!");
				}
				files[filename]=file;
			}
			this.getContentType = function(){
				return contentType;
			}
		}
	};
	
	function parsePrams(arguments) {
		var param = {};
		param.service=arguments[0];
		param.method=arguments[1];
		param.params = new Array(arguments.length-2);
		if(arguments.length>2){
			for(var i=2;i<arguments.length;i++){
				if(arguments[i] instanceof $jqzw_server.Files){
					param.params[i-2] = 'clientFile';
					param.files=arguments[i];
				}else{
					param.params[i-2]=arguments[i];
				}
			}
		}
		return param;
	}

	function httpRequestCall(param, url) {
		var result = {
			resultType:null,
			resultText:null,
			iscall:false,
			handlers:{},
			callResult:function(type,rtt){
				result.resultType = type;
				result.resultText = rtt;
				result.exe_call();
			},
			exe_call:function(){
				if(result.resultType&&
						result.handlers[result.resultType]
					&&!result.iscall){
					result.iscall=true;
					result.handlers[result.resultType](result.resultText);
				}
			},
			resultThen:function(key,handlefun){
				result.handlers[key] = handlefun;
				result.exe_call();
			}
		};
		var request = creatHttpRequest();
		var pstr = null;
		for ( var key in param) {
			if (!(param[key] instanceof Function)) {
				pstr = pstr ? pstr + '&' : '';
				pstr = pstr + key + '=' + encodeURIComponent(warpString(param[key]));
			}
		}
		request.onreadystatechange = function() {
			if (request.readyState == 4 ) {
				if(request.status==200){
					try{
						var jr =JSON.parse(request.responseText);
						result.callResult(jr.type,jr.value);
					}catch(e){
						result.callResult(error,e);
						console.log(e);
					}
				}else{
					result.callResult(error,request.responseText);
				}
			}
		}
		request.open('POST', url, true);
//		request.open('POST', url+'?'+pstr, true);
		if((!param.files)||param.files.getContentType()){
			request.setRequestHeader("Content-type",
			"application/x-www-form-urlencoded;charset=UTF-8");
		}
		
		if(param.files){
			var formData = new FormData();
			var files = param.files.getFiles();
			console.log(files);
			for(var key in files){
				console.log(files[key]);
				formData.append('jqzwfile-'+key,files[key]);
			}
			request.send(formData);
		}else{
			request.send(pstr);
		}
		return result;
	};

	function warpString(obj){
		if(!obj){
			return '';
		}
		if(typeof obj =='number'||typeof obj =='boolean'){
			return obj.toString();
		}else if(typeof obj =='string'){
			return obj;
		}else{
			return JSON.stringify(obj);
		}
	};
	
	function creatHttpRequest() {
		var xmlhttp;
		if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera,Safari
			xmlhttp = new XMLHttpRequest();
		} else {// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return xmlhttp;
	};
	
	
	function jqzw_hex_md5(s){
		if(s==null||s==''){
			return '00000000000000000000000000000000';
		}else{
			return  hex_md5(s);
		}
	}
	/*
	 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
	 * Digest Algorithm, as defined in RFC 1321.
	 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
	 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
	 * Distributed under the BSD License
	 * See http://pajhome.org.uk/crypt/md5 for more info.
	 */

	/*
	 * Configurable variables. You may need to tweak these to be compatible with
	 * the server-side, but the defaults work in most cases.
	 */
	var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
	var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
	var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

	/*
	 * These are the functions you'll usually want to call
	 * They take string arguments and return either hex or base-64 encoded strings
	 */
	function hex_md5(s){ return binl2hex(core_md5(str2binl(s), s.length * chrsz));}
	function b64_md5(s){ return binl2b64(core_md5(str2binl(s), s.length * chrsz));}
	function str_md5(s){ return binl2str(core_md5(str2binl(s), s.length * chrsz));}
	function hex_hmac_md5(key, data) { return binl2hex(core_hmac_md5(key, data)); }
	function b64_hmac_md5(key, data) { return binl2b64(core_hmac_md5(key, data)); }
	function str_hmac_md5(key, data) { return binl2str(core_hmac_md5(key, data)); }

	/*
	 * Perform a simple self-test to see if the VM is working
	 */
	function md5_vm_test()
	{
	  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
	}

	/*
	 * Calculate the MD5 of an array of little-endian words, and a bit length
	 */
	function core_md5(x, len)
	{
	  /* append padding */
	  x[len >> 5] |= 0x80 << ((len) % 32);
	  x[(((len + 64) >>> 9) << 4) + 14] = len;

	  var a =  1732584193;
	  var b = -271733879;
	  var c = -1732584194;
	  var d =  271733878;

	  for(var i = 0; i < x.length; i += 16)
	  {
	    var olda = a;
	    var oldb = b;
	    var oldc = c;
	    var oldd = d;

	    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
	    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
	    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
	    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
	    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
	    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
	    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
	    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
	    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
	    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
	    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
	    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
	    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
	    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
	    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
	    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

	    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
	    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
	    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
	    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
	    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
	    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
	    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
	    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
	    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
	    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
	    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
	    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
	    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
	    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
	    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
	    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

	    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
	    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
	    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
	    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
	    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
	    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
	    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
	    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
	    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
	    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
	    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
	    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
	    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
	    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
	    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
	    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

	    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
	    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
	    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
	    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
	    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
	    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
	    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
	    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
	    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
	    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
	    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
	    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
	    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
	    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
	    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
	    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

	    a = safe_add(a, olda);
	    b = safe_add(b, oldb);
	    c = safe_add(c, oldc);
	    d = safe_add(d, oldd);
	  }
	  return Array(a, b, c, d);

	}

	/*
	 * These functions implement the four basic operations the algorithm uses.
	 */
	function md5_cmn(q, a, b, x, s, t)
	{
	  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
	}
	function md5_ff(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t)
	{
	  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t)
	{
	  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t)
	{
	  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	/*
	 * Calculate the HMAC-MD5, of a key and some data
	 */
	function core_hmac_md5(key, data)
	{
	  var bkey = str2binl(key);
	  if(bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);

	  var ipad = Array(16), opad = Array(16);
	  for(var i = 0; i < 16; i++)
	  {
	    ipad[i] = bkey[i] ^ 0x36363636;
	    opad[i] = bkey[i] ^ 0x5C5C5C5C;
	  }

	  var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
	  return core_md5(opad.concat(hash), 512 + 128);
	}

	/*
	 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
	 * to work around bugs in some JS interpreters.
	 */
	function safe_add(x, y)
	{
	  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	  return (msw << 16) | (lsw & 0xFFFF);
	}

	/*
	 * Bitwise rotate a 32-bit number to the left.
	 */
	function bit_rol(num, cnt)
	{
	  return (num << cnt) | (num >>> (32 - cnt));
	}

	/*
	 * Convert a string to an array of little-endian words
	 * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
	 */
	function str2binl(str)
	{
	  var bin = Array();
	  var mask = (1 << chrsz) - 1;
	  for(var i = 0; i < str.length * chrsz; i += chrsz)
	    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
	  return bin;
	}

	/*
	 * Convert an array of little-endian words to a string
	 */
	function binl2str(bin)
	{
	  var str = "";
	  var mask = (1 << chrsz) - 1;
	  for(var i = 0; i < bin.length * 32; i += chrsz)
	    str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
	  return str;
	}

	/*
	 * Convert an array of little-endian words to a hex string.
	 */
	function binl2hex(binarray)
	{
	  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
	  var str = "";
	  for(var i = 0; i < binarray.length * 4; i++)
	  {
	    str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
	           hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
	  }
	  return str;
	}

	/*
	 * Convert an array of little-endian words to a base-64 string
	 */
	function binl2b64(binarray)
	{
	  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	  var str = "";
	  for(var i = 0; i < binarray.length * 4; i += 3)
	  {
	    var triplet = (((binarray[i   >> 2] >> 8 * ( i   %4)) & 0xFF) << 16)
	                | (((binarray[i+1 >> 2] >> 8 * ((i+1)%4)) & 0xFF) << 8 )
	                |  ((binarray[i+2 >> 2] >> 8 * ((i+2)%4)) & 0xFF);
	    for(var j = 0; j < 4; j++)
	    {
	      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
	      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
	    }
	  }
	  return str;
	}

})(window, document);

