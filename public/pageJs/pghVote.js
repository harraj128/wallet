 angularApp.controller('myCtrl', function($scope, $http) {


     $scope.gasLimit = 21000;
     $scope.gasPrice = 10;
     $scope.nonce = 0;
     $scope.balance = 0;
     $scope.maxSendAmount = 0;
     $scope.voteid = 0;
     $scope.toAmount=0;
     $scope.toAddress="0xf81d05034ffc3c13af98c4293146802b50bc7f4f";



     $scope.showAddData = function() {
         $scope.addDataFlag = true;
     }
     $scope.getBalance = function() {
         $scope.spin = "myIconSpin";
         var obj = {};
         obj.chainId = $scope.chain.id;
         obj.address = $scope.account.address;
         var url = APIHost + "/getBalance";
         $http({
             method: 'POST',
             url: url,
             data: obj
         }).then(function successCallback(res) {
             $scope.spin = "";
             removePageLoader();
             if (res.data.result == "success") {
                 $scope.balance = res.data.data;
                 $scope.getMaxSendAmount();
             } else {
                 showPopup(res.data.error, 3000);
             }

         }, function errorCallback(res) {
             showPopup("Internet error, please refresh the page");
         });

         // queryTransactionList($scope.account.address, $scope.chain.id).then(function(robj) {
         //     $scope.transactionList = robj.data;
         //     $scope.$apply();
         // })
     }

     $scope.getMaxSendAmount = function() {
         let b = new BigNumber($scope.balance);
         let gl = new BigNumber($scope.gasLimit);
         let fee = gl.times($scope.gasPrice * Math.pow(10, 9)).dividedBy(Math.pow(10, 18));
         if (b.gt(fee)) {
             $scope.maxSendAmount = b.minus(fee).decimalPlaces(18);
         } else {
             $scope.maxSendAmount = new BigNumber(0);
         }
     }

     $scope.nonceFlag = true;
     $scope.getNonce = function() {
         $scope.nonceFlag = false;
         var obj = {};
         obj.chainId = $scope.chain.id;
         obj.address = $scope.account.address;
         var url = APIHost + "/getNonce";
         $http({
             method: 'POST',
             url: url,
             data: obj
         }).then(function successCallback(res) {
             //console.log(res);
             if (res.data.result == "success") {
                 $scope.nonce = Number(res.data.data);
                 $scope.nonceFlag = true;
             } else {
                 showPopup(res.data.message, 3000);
             }

         }, function errorCallback(res) {
             showPopup("Internet error, please refresh the page");
         });


     }
     //chain list

     $scope.chainList = new Array();
     $scope.chainList = [
         { name: "Main Chain", id: 0, chainId: "pchain" }
     ];

     $scope.chain = $scope.chainList[0]

     queryChainList().then(function(resData) {
         for (var i = 0; i < resData.data.length; i++) {
             var obj = {};
             obj.name = resData.data[i].chainName;
             obj.id = resData.data[i].id;
             obj.chainId = resData.data[i].chainId;
             $scope.chainList.push(obj);
             $scope.chain = $scope.chainList[0];
         }
     }).catch(function(e) {
         console.log(e, "queryChainList error.");
     });


     $scope.getRecommendList = function() {
         var obj = {};
         var url = APIHost + "/getPghList";
         $http({
             method: 'POST',
             url: url,
             data: obj
         }).then(function successCallback(res) {
             // console.log(res);
             if (res.data.result == "success") {
                 $scope.votingList = res.data.data;

                 // $scope.$apply();
             } else {
                 showPopup(res.data.message, 3000);
             }

         }, function errorCallback(res) {
             showPopup("Internet error, please refresh the page");
         });


     };

     $scope.savePghVote = function(hash,address) {
         var obj = {};
         obj.id=$scope.voteid;
         obj.hash=hash;
         obj.fromAddress=address;
         console.log(obj)
         var url = APIHost + "/savePghVote";
         $http({
             method: 'POST',
             url: url,
             data: obj
         }).then(function successCallback(res) {
             if (res.data.result == "success") {
                 $scope.getRecommendList();
             } else {
                 showPopup(res.data.message, 3000);
             }

         }, function errorCallback(res) {
             showPopup("Internet error, please refresh the page");
         });


     }

     $scope.crossChain = 1;

     $scope.accountList = new Array();

     queryAccountList().then(function(resObj) {
         $scope.accountList = resObj.data;
         try {
             if ($scope.accountList.length > 0) {
                 $scope.account = $scope.accountList[0];
                 $scope.getBalance();
             }
             if ($scope.accountList.length == 0) {
                 removePageLoader();
                 window.location.href = "wallet.html";
             }
         } catch (e) {
             console.log(e);
         }
     }).catch(function(e) {
         console.log(e, "error");
     })



     $scope.currentPrivateKey = "";
     $scope.confirmPassword = function() {
         if ($scope.account == undefined) {
             swal("Please create a wallet address at first");
             return;
         }
         queryPrivateKey($scope.account.address).then(function(result) {

             if (result.result == "success") {
                 var dePri = AESDecrypt(result.data.privateKey, $scope.inputPassword);
                 if (dePri) {
                     $scope.currentPrivateKey = dePri;
                     $scope.inputPassword = "";
                     $scope.$apply();
                     $('#enterPassword').modal('hide');
                     $scope.submit();

                 } else {
                     swal("Password error");
                 }
             } else {
                 swal("Password error");
             }
         }).catch(function(e) {

             swal("Password error");
         })

     };

     $scope.selectAccount = function() {
         $scope.getNonce();
         $scope.getBalance();
     }

     $scope.showEnterPwd = function(id) {
         if($scope.balance>=10000){
                 var obj = {};
                 obj.fromAddress=$scope.account.address;
                 var url = APIHost + "/queryAddressVoteNum";
                 $http({
                     method: 'POST',
                     url: url,
                     data: obj
                 }).then(function successCallback(res) {
                     if (res.data.result == "success") {
                         if(res.data.data<2){
                             $scope.voteid=id;
                             $scope.getMaxSendAmount();
                             if ($scope.maxSendAmount.lt(new BigNumber($scope.toAmount))) {
                                 let tips1 = "Insufficient Balance ";
                                 let tips2 = "Max Amount :" + $scope.maxSendAmount + " PI"
                                 swal(tips1, tips2, "error");
                             } else {
                                 $('#enterPassword').modal('show');
                             }
                         }else{
                             showPopup("Sorry,2 votes per day for one address");
                         }
                     } else {
                         showPopup(res.data.message, 3000);
                     }
                 }, function errorCallback(res) {
                     showPopup("Internet error, please refresh the page");
                 });

         }else{
             showPopup("Sorry, balance must be equal or greater than to 10000 PI");
         }


     }

     var web3 = new Web3();
     var toAmountValue;
     $scope.submit = function() {
         $scope.getNonce();
         var txFee = $scope.gasLimit * $scope.gasPrice * Math.pow(10, 9);
         $scope.txFee = web3.fromWei(txFee, 'ether');
         $('#transaction').modal('show');
     }

     $scope.gasChanged = function() {
         $scope.gasPrice = jQuery("#gasPrice").val();

     }

     $scope.getRecommendList();
     $scope.sendTx = function() {
         try {
             const gasPrice = $scope.gasPrice * Math.pow(10, 9);
             const amount = web3.toWei($scope.toAmount, "ether");
             var nonce = $scope.nonce;
             var signRawObj = initSignRawPAI($scope.toAddress, amount, nonce, gasPrice, $scope.gasLimit, $scope.chain.chainId);

             if ($scope.data) signRawObj.data = $scope.data;

             var signData = signTx($scope.currentPrivateKey, signRawObj);
             $scope.currentPrivateKey = "";
             
             var obj = {};
             obj.chainId = $scope.chain.id;
             obj.signData = signData;

             loading();
             var url = APIHost + "/sendTx";
             $http({
                 method: 'POST',
                 url: url,
                 data: obj
             }).then(function successCallback(res) {
                 removeLoading();
                 if (res.data.result == "success") {
                     $('#transaction').modal('hide');
                     var hash = res.data.data;
                     var url = "index.html?key=" + hash + "&chain=" + $scope.chain.id;
                     var html = '<a href="' + url + '"  >Transaction hash:' + hash + '</a>';
                     successNotify(html);
                     $scope.savePghVote(hash,$scope.account.address);
                     // var objt = {};
                     // objt.hash = hash;
                     // objt.nonce = nonce;
                     // objt.fromaddress = $scope.account.address;
                     // objt.toaddress = $scope.toAddress;
                     // objt.value = $scope.toAmount;
                     // objt.gas = $scope.gasLimit;
                     // objt.gasPrice = gasPrice;
                     // objt.chainId = $scope.chain.id;
                     // objt.data = $scope.data;
                     // objt.chainName = $scope.chain.name;
                     // addTransaction(objt).then(function(aobj) {
                     //     if (aobj.result == "success") {
                     //         queryTransactionList($scope.account.address, $scope.chain.id).then(function(robj) {
                     //             $scope.transactionList = robj.data;
                     //             $scope.$apply();
                     //         })
                     //     }
                     // })
                 } else {
                     swal(res.data.error);
                 }

             }, function errorCallback(res) {
                 console.log(res);
                 showPopup("Internet error, please refresh the page");
             });

         } catch (e) {
             console.log(e);
             swal(e.toString());
         }

     }

     $scope.cutWords = function(words) {
         let result = words;
         if (words.length > 12) {
             result = words.substr(0, 6) + "..." + words.substr(-6, 6);
         }
         return result;
     }

 });
 $(function() {
     menuActive(9);
 });