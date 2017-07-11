var https = require("https");
var http = require("http");


//your domain
var domain = '';

//a records to update
var aRecordName = [''];

//your key
var key = '';
//your secret
var secret = '';

//get the local ip address
var myIp = '';
var myIpRequestOptions = {
	host: 'ipinfo.io',
	path: '/json',
	method: 'GET'
};
var myIpRequest = http.request(myIpRequestOptions, function (response) {
	response.on('data', function (chunk) {
		myIp += chunk;
	})
	response.on('end', function () {
		var parsed = JSON.parse(myIp);
		myIp = parsed.ip;
		console.log("Found ip, currently: " + myIp);

		for (var index = 0; index < aRecordName.length; index++) {
			doGetDnsResponseFromGoDaddy(aRecordName[index]);
		}
	});
});
myIpRequest.end();


function doGetDnsResponseFromGoDaddy(recordName){
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
		console.log("Current dns record from GoDaddy: "+ dnsIP);
		var data = JSON.parse(dnsIP);
		doUpdateDnsEntries(data[0].data, recordName);
	});
	response.on('data', function (chunk) {
		dnsIP += chunk;
	})
});
dnsGetFromGoDaddy.end();
}


function doUpdateDnsEntries(dnsIp, recordName) {
	if (myIp != dnsIp) {
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
}