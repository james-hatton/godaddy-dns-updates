var https = require("https");
var http = require("http");

//your domain
var domain = '{yourdomain}';

//a records to update
var aRecordName = [{yourarecords}];

//your key
var key = '{yourgodaddyapikey}';
//your secret
var secret = '{yourgodaddysecret}';


requestIpFromIpInfo();

function isIpOk(ipData) {
	if (ipData.ip != '' && ipData != null) {
		return true;
	}
	return false;
}
function requestIpFromIpInfo() {
	var myIp = '';
	var myIpRequestOptions = {
		host: 'ipinfo.io',
		path: '/json',
		method: 'GET'
	};

	//callback
	callback = function (response) {
		response.on('data', function (chunk) {
			myIp += chunk;
		})
		response.on('end', function () {
			"use strict";
			let parsed = JSON.parse(myIp);
			myIp = parsed.ip;
			if (isIpOk(parsed)) {
				console.log("Found ip, currently: " + myIp);

				for (var index = 0; index < aRecordName.length; index++) {
					doGetDnsResponseFromGoDaddy(aRecordName[index], myIp);
				}
			}
			else {
				requestIpFromIpInfo();
			}
		});
	}



	var request = http.request(myIpRequestOptions, callback);
	request.end();
}
function doGetDnsResponseFromGoDaddy(recordName, myIp) {
	var dnsIP = '';
	var optionsForDnsGetQueries = {
		host: 'api.godaddy.com',
		path: '/v1/domains/' + domain + '/records/A/' + recordName,
		method: 'GET',
		headers: {
			'Authorization': 'sso-key ' + key + ':' + secret
		}
	};
	var dnsGetFromGoDaddy = https.request(optionsForDnsGetQueries, function (response) {
		response.on('end', function () {
			console.log("Current dns record from GoDaddy: " + dnsIP);
			var data = JSON.parse(dnsIP);
			doUpdateDnsEntries(myIp,data[0].data, recordName);
		});
		response.on('data', function (chunk) {
			dnsIP += chunk;
		})
	});
	dnsGetFromGoDaddy.end();
}


function doUpdateDnsEntries(myIp,dnsIp, recordName) {
	if (myIp != dnsIp && myIp != '') {
		//then update
		var request = {};
		request.ttl = 3700;
		request.data = myIp;

		var asJson = JSON.stringify(request);

		var optionsForDnsUpdateQuery = {
			host: 'api.godaddy.com',
			path: '/v1/domains/' + domain + '/records/A/' + recordName,
			method: 'PUT',
			headers: {
				'Authorization': 'sso-key ' + key + ':' + secret,
				'Content-Type': 'application/json'
			}
		};
		var updateResponse = '';
		var updateDns = https.request(optionsForDnsUpdateQuery, function (response) {

			response.on('data', function (chunk) {
				updateResponse += chunk;
			});
			response.on('error', function (e) { console.log(e); });
			response.on('end', function () {

			});
		});
		updateDns.write(asJson);
		updateDns.end();
	}
	else {
		console.log("Not updating, ips the same");
	}
}
