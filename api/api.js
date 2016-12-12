var md5 = require('md5');


module.exports = function(app, connection) {

    app.post('/api/v1/newemail', function(req, res) {
        // regex on both client and server side for protection in case JS is augmented
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(req.body.email)) {
            res.json('Email address is not valid!');
        } else {
            var email = req.body.email;
            var name = email.substring(0, email.lastIndexOf("@"));
            var domain = email.substring(email.lastIndexOf("@") +1);
            var hashCode = md5(name + domain);
            var referredBy;
            if(req.body.hashCode !== undefined) {
                connection.query('SELECT emailaddress FROM emails WHERE `referralcode`=(?)', [req.body.hashCode], function(err, rows, fields) {
                    if(err) throw err;
                    referredBy = rows[0].emailaddress;
                });
            }
            connection.query('INSERT INTO emails (emailaddress, referralcode, referredby) VALUES (?, ?, ?)', [req.body.email, hashCode, referredBy], function(err, rows, fields) {
                if (err) {
                    res.status(401);
                } else {
                    var helper = require('sendgrid').mail;
                    var from = new helper.Email("schemeBeam@schemeBeam.com");
                    var to = new helper.Email(req.body.email);
                    var subject = "subject here";
                    var content = new helper.Content(
                            "text/html", "<h1>Your referral link:</h1> <h2>" + req.body.domain + "/#/" + hashCode + "</h2>" +
                            "<div><a href=\"" + req.body.domain + "/#/verify/" + hashCode + "\">Click here</a> to activate your referral link and to get started sharing with your contacts! Good luck!</div>");
                    var mail = new helper.Mail(from, subject, to, content);

                    var sg = require('sendgrid')(SENDGRID_API_KEY);

                    var request = sg.emptyRequest({
                      method: 'POST',
                      path: '/v3/mail/send',
                      body: mail.toJSON(),
                    });

                    function sendMessage() {
                        sg.API(request, function(error, response) {
                          // Handle the response here.
                        });
                    }
                    sendMessage();
                }
            });
        }
        res.end();
    });

    app.get('/api/v1/checkhash/:thisId', function(req, res) {
        var url_Id = req.param('thisId');
        connection.query('SELECT referralcode FROM emails WHERE `referralcode`=(?)',[url_Id], function(err, rows, fields){
          if(rows.length !== 0){
            res.json(200);
          } else {
            res.json(401);
          }
        res.end();
        });
    });

    app.get('/api/v1/verifyhash/:thisId', function(req, res) {
        var url_Id = req.param('thisId');
        connection.query('SELECT verified,referredby FROM emails WHERE `referralcode`=(?)',[url_Id], function(err, rows, fields){
            if(err) throw err;
            var referredBy = rows[0].referredby;
            var verified = rows[0].verified;
            if(verified === "false") {
                connection.query('UPDATE emails SET `verified`=(?) WHERE `referralcode`=(?)',["true", url_Id], function(err, rows, fields){
                    if(err) throw err;
                    connection.query('UPDATE emails SET referrals = referrals + 1 WHERE `emailaddress`=(?)',[referredBy], function(err, rows, fields){
                        if(err) throw err;
                    });
                });
            }
            res.end();
        });
    });

    app.get('/api/v1/topreferrers/', function(req, res) {
        //fetch the top referrers
        res.end();
    });

    app.get('/api/v1/getrank/:thisId', function(req, res) {
        var url_Id = req.param('thisId');
        console.log(url_Id);
            connection.query(
                'SELECT * FROM (  SELECT emailaddress, referrals, referralcode, @rownum:=@rownum + 1 as row_number FROM emails t1,' +
                '(SELECT @rownum := 0) t2 ORDER BY referrals DESC, datetime DESC) t1 WHERE `referralcode`=(?)',[url_Id], 
                function(err, rows, fields){   
                    if(err) throw err;
                    res.json(rows);
                    res.end();
            });
    });

}