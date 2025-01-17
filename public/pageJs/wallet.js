    var Accounts = new Accounts();
    var web3 = new Web3();
    $('.collapse').collapse();

    const {ipcRenderer} = require('electron');

    angularApp.controller('myCtrl', function($scope, $http) {
        $scope.showTxDetail = (pid, index) => {
            queryMultiChainChildTxList(pid).then(function(data) {
                $scope.txList[index].showDetail = !$scope.txList[index].showDetail;
                $scope.txList[index].txChildList = data.data;
                if($scope.txList[index].txChildList.length == 1){
                    let crossChainTx = $scope.txList[index];
                    let firstTx = $scope.txList[index].txChildList[0];
                    let sendChainId = 0;
                    if(crossChainTx.toaddress.indexOf("Child") > -1){
                        sendChainId = Number(  crossChainTx.toaddress.replace("Child Chain ","") );
                    }
                    var sendTxObj = {"chainName":crossChainTx.toaddress,fromChainName:crossChainTx.fromaddress,"status":404,"fromaddress":firstTx.fromaddress,"hash":"0x0",pid:pid,fromChainId:crossChainTx.chainId,chainId:sendChainId,firstTxHash:firstTx.hash,toAmount:crossChainTx.value};
                    $scope.txList[index].txChildList.push(sendTxObj);
                }
                $scope.$apply();
            })
        }
        $scope.chainList = new Array();
        $scope.chainList2 = new Array();
        $scope.chainList = [
            { name: "Main Chain", id: 0, chainId: "pchain" }
        ];
        $scope.chain = $scope.chainList[0];
        queryChainList().then(function(resData) {
            for (var i = 0; i < resData.data.length; i++) {
                var obj = {};
                obj.name = resData.data[i].chainName;
                obj.id = resData.data[i].id;
                obj.chainId = resData.data[i].chainId;
                $scope.chainList.push(obj);
                $scope.chainList2.push(obj);
            }
            $scope.crossChain = $scope.chainList2[0];
            // $scope.crossChain = 1;
            $scope.$apply();
        }).catch(function(e) {
            console.log(e, "queryChainList error.");
        })

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
                removePageLoader();
                $scope.spin = "";
                if (res.data.result == "success") {
                    $scope.balance = res.data.data;
                    $scope.getMaxSendAmount();
                } else {
                    swal("Error",res.data.error,"error");
                }

            }, function errorCallback(res) {
                swal("Error","Internet error, please refresh the page","erro");
            });

            queryMultiChainTxList($scope.account.address, $scope.chain.id).then(function(data) {
                $scope.txList = data.data;
                $scope.$apply();
            })
        }

        $scope.getMaxSendAmount = function() {
            let b = new BigNumber($scope.balance);
            let gl = new BigNumber($scope.gasLimit);
            let fee = gl.times($scope.gasPrice * Math.pow(10, 9)).dividedBy(Math.pow(10, 18));
             if(b.gt(fee)){
                $scope.maxSendAmount = b.minus(fee).decimalPlaces(18);
             }else{
                $scope.maxSendAmount = new BigNumber(0);
             }
        }

        var clipboard2 = new Clipboard('.copyBtn2', {
            container: document.getElementById('accountDetail')
        });

        clipboard2.on('success', function(e) {
            showNotification("alert-success", "Copy successfully", "bottom", "center", 1000);
        });

        $scope.openAccountDetail = function() {

            $('#accountDetail').modal('show');
            var qrnode = new AraleQRCode({ text: $scope.account.address });

            $('#qrcode').html(qrnode);
        }

        $scope.pwdFormtype = 0;
        $scope.enterPassword = function(type) {
            $scope.pwdFormtype = type;
            if (type == 0) {
                $scope.getMaxSendAmount();
                if ( $scope.maxSendAmount.lt( new BigNumber($scope.toAmount))) {
                    let tips1 = "Insufficient Balance ";
                    let tips2 = "Max Amount :" + $scope.maxSendAmount + " PI"
                    swal(tips1, tips2, "error");
                } else {
                    $('#enterPassword').modal('show');
                }
            } else {
                $('#enterPassword').modal('show');
            }
        }

        $scope.showPasswordArea = function(item) {
            let targetAddress = item.fromaddress;
            if($scope.account.address == targetAddress){
                $('#enterPassword').modal('show');
                $scope.pwdFormtype = 2; 
                $scope.currentResendSecondTx = item;
            }else{
                let tips = "Please Address:"+targetAddress;
                swal("Address Error",tips,"error");
            }
        }

        $scope.nonceFlag = true;
        $scope.getNonce = function(chainId,type) {

            $scope.nonceFlag = false;
            var obj = {};
            obj.chainId = chainId;
            obj.address = $scope.account.address;
            var url = APIHost + "/getNonce";
            $http({
                method: 'POST',
                url: url,
                data: obj
            }).then(function successCallback(res) {
                if (res.data.result == "success") {
                    if(type == 1){
                        $scope.nonce2 = Number(res.data.data);
                    }else{
                        if (chainId == $scope.chain.id) {
                            $scope.nonce = Number(res.data.data);
                        } else {
                            $scope.nonce2 = Number(res.data.data);
                        }
                    } 
                    $scope.nonceFlag = true;
                } else {
                    showPopup(res.data.message, 3000);
                }

            }, function errorCallback(res) {
                showPopup("Internet error, please refresh the page");
            });
        }


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
                    $('#newAccount').modal('show');
                }
            } catch (e) {
                console.log(e);
            }
        }).catch(function(e) {
            console.log(e, "error");
        })

        $scope.balance = 0;
        $scope.gasLimit = 42000;
        $scope.gasPrice = 10;
        $scope.nonce = 0;
        $scope.nonce2 = 0;

        $scope.crossChain = $scope.chainList2[0];



        $scope.selectChain = function() {
            if ($scope.chain.id == 0) {

                queryChainList().then(function(resData) {
                    $scope.chainList2 = new Array();
                    for (var i = 0; i < resData.data.length; i++) {
                        var obj3 = {};
                        obj3.name = resData.data[i].chainName;
                        obj3.id = resData.data[i].id;
                        $scope.chainList2.push(obj3);
                        $scope.crossChain = $scope.chainList2[0];
                        $scope.$apply();

                    }
                }).catch(function(e) {
                    console.log(e, "queryChainList error.");
                });

            } else {
                $scope.chainList2 = new Array();
                // var obj4 = { name: "Main Chain", id: 0, chainId: "pchain" };
                var obj4 = { name: "Main Chain", id: 0, chainId: "pchain" };
                $scope.chainList2.push(obj4);
                $scope.crossChain = obj4;
            }
            $scope.getBalance();

        }

        $scope.newPrivateKet = function() {
            var newAccount = Accounts.new();
            return newAccount.unCryp.private;
        }

        $scope.add = function() {

            var newPrivateKey = $scope.newPrivateKet();

            var obj = {};

            obj.address = priToAddress(newPrivateKey);

            $scope.accountList.push(obj);
            var enPri = AESEncrypt(newPrivateKey, $scope.password);
            addAccount(enPri, obj.address).then(function(resObj) {
                if (resObj.result == "success") {
                    showPopup("Created successfully", 1000);
                    $('#newAccount').modal('hide')

                    if ($scope.accountList.length > 0) {
                        $scope.account = $scope.accountList[$scope.accountList.length - 1];
                    }
                    $scope.getBalance();
                }
            }).catch(function(e) {
                console.log(e, "error");
            })
        }

        $scope.importPrivateKey = function(){

            var newPrivateKey = $scope.newPrivate;

            var obj = {};
            
            obj.address = priToAddress(newPrivateKey);

            var enPri = AESEncrypt(newPrivateKey,$scope.password2);
            $scope.password2 = "";
            $scope.repeatPassword2 = "";
            $scope.newPrivate = "";
            newPrivateKey = "";

            importAccount(enPri,obj.address).then(function (resObj) {
                if(resObj.result=="success"){
                    $scope.accountList.push(obj);
                    showPopup("Import Successfully",1000);
                    $('#importAccount').modal('hide');
                    
                    if($scope.accountList.length> 0){
                        $scope.account = $scope.accountList[$scope.accountList.length-1];
                    }
                    $scope.getBalance();
                }
            }).catch(function (e) {
                showPopup(e.error,2000);
                $('#importAccount').modal('hide');
                $scope.password2 = "";
                $scope.repeatPassword2 = "";
                $scope.newPrivate = "";
            })
            
        }

        var clipboard3 = new Clipboard('.copyBtn3', {
            container: document.getElementById('exportPrivateKey')
        });

        clipboard3.on('success', function(e) {
            showNotification("alert-success", "Copy successfully", "bottom", "center", 1000);
        });

        $scope.currentPrivateKey = "";
        $scope.confirmPassword = function() {
            if ($scope.account == undefined) {
                swal("Error","Please create a wallet address at first","error");
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

                        if ($scope.pwdFormtype == 1) { //export Private key

                            $('#exportPrivateKey').modal('show');
                        } else if($scope.pwdFormtype == 2) { //send tx
                            $scope.getNonce($scope.currentResendSecondTx.chainId,1);  //Get Second Chain Nonce
                            $('#resendTransaction').modal('show');
                           
                        }else{
                            $scope.submit();
                        }
                    } else {
                        swal("Error","Password error","error");
                    }
                } else {
                    swal("Error","Password error","error");
                }
            }).catch(function(e) {

                swal("Error","Password error","error");
            })

        };


        $scope.downloadKeystore = function() {
            if ($scope.account == undefined) {
                swal("Error","Please create a wallet address at first","error");
                return;
            }
            queryPrivateKey($scope.account.address).then(function(result) {
                if (result.result == "success") {
                    var dePri = AESDecrypt(result.data.privateKey, $scope.keystonePassword);
                    if (dePri) {
                        const {dialog} = require('electron').remote
                        $scope.currentPrivateKey = dePri;
                        dialog.showOpenDialog({
                            properties: [
                                'openDirectory',
                            ],
                            filters: [
                                { name: 'All', extensions: ['*'] },
                            ]
                        },function(res){
                            exportKeystone(res[0],$scope.currentPrivateKey,$scope.keystonePassword).then(function(result) {
                                console.log(result)
                                if(result.result=="success"){
                                    $('#exportKeyStore').modal('hide');
                                    showPopup("Download Keystore Successfully",2000);
                                    $scope.currentPrivateKey="";
                                    $scope.keystonePassword="";
                                }
                            }).catch(function (e) {
                                showPopup(e.error,1000);
                            })

                        })


                    } else {
                        swal("Error","Password error","error");
                    }
                } else {
                    swal("Error","Password error","error");
                }
            }).catch(function(e) {
                swal("Error","Password error","error");
            })

        };

        $scope.getChainNameByid = function(id) {
            var name = "Main Chain";
            if (id > 0) {
                name = "Child Chain " + id;
            }
            return name;
        }
        var web3 = new Web3();
        $scope.submit = function() {
            var txFee = $scope.gasLimit * $scope.gasPrice * Math.pow(10, 9);
            $scope.txFee = web3.fromWei(txFee, 'ether');

            $scope.getNonce($scope.chain.id);

            $('#transaction').modal('show');
        }

        $scope.resendSecondTx = function() {
            loading();
            let pid = $scope.currentResendSecondTx.pid;
            if($scope.currentResendSecondTx.chainId == 0){
                let childToMainAmount = web3.toWei($scope.currentResendSecondTx.toAmount, "ether");
                $scope.confirmChildToMain($scope.currentResendSecondTx.firstTxHash, childToMainAmount, pid,0);
                console.log("in resendSecondTx.......");
            }else{
                $scope.confirmMainToChild($scope.currentResendSecondTx.firstTxHash, pid, true,0);
            }
            
        }

        $scope.sendTx = function() {
            loading();
            if ($scope.chain.id == 0) {
                $scope.mainToChild();
            } else {

                $scope.childToMain();
            }
        }

        $scope.checkReceipt = function(txHash, chainId, type, childToMainAmount, pid, flag,num) {

            var obj = {};
            obj.txHash = txHash;
            obj.chainId = chainId;
            var url = APIHost + "/getTxRecipt";
            $http({
                method: 'POST',
                url: url,
                data: obj
            }).then(function successCallback(res) {
                if (res.data.data) {
                    if (type == 2) {
                        setTimeout(function() {
                            num++;
                            $scope.checkChildTxInMainChain(txHash, chainId, childToMainAmount, pid, flag,num);
                        }, 2000);
                    }

                } else {
                    setTimeout(function() {
                        num++;
                        $scope.checkReceipt(txHash, chainId, type, childToMainAmount, pid, flag,num);
                    }, 2000);
                }

            }, function errorCallback(res) {
                swal("Error","Internet error, please refresh the page","error");

            });
        }

        $scope.checkChildTxInMainChain = function(txHash, chainId, childToMainAmount, pid,flag,num) {
            var obj = {};
            obj.txHash = txHash;
            obj.chainId = chainId;
            var url = APIHost + "/getChildTxInMainChain";
            $http({
                method: 'POST',
                url: url,
                data: obj
            }).then(function successCallback(res) {
                if (res.data.result == "error") {
                    if(num<30){
                        num++;
                        setTimeout(function() {
                            $scope.checkChildTxInMainChain(txHash,chainId,childToMainAmount,pid,num);
                        }, 2000);
                    }else{
                        num++;
                        $scope.confirmChildToMain(txHash,childToMainAmount,pid,num);
                    }

                } else {
                    $scope.confirmChildToMain(txHash,childToMainAmount,pid,num);
                }
            }, function errorCallback(res) {
                setTimeout(function() {
                    num++;
                    $scope.checkChildTxInMainChain(txHash,chainId,childToMainAmount,pid,num);
                }, 2000);

            });
        }



        $scope.checkMainTxInChildChain = function(txHash, chainId, pid, flag,num) {
            var obj = {};
            obj.txHash = txHash;
            obj.chainId = chainId;

            var url = APIHost + "/getMainTxInChildChain";
            $http({
                method: 'POST',
                url: url,
                data: obj
            }).then(function successCallback(res) {
                if (!res.data.data) {
                    if(num<30){
                        setTimeout(function() {
                            num++;
                            $scope.checkMainTxInChildChain(txHash, chainId, pid, flag,num);
                        }, 2000);
                    }else{
                        num++;
                        $scope.confirmMainToChild(txHash, pid, flag,num);
                    }
                } else {
                    $scope.confirmMainToChild(txHash, pid, flag,num);
                }
            }, function errorCallback(res) {
                setTimeout(function() {
                    num++;
                    $scope.checkMainTxInChildChain(txHash, chainId, pid, flag,num);
                }, 2000);

            });
        }

        $scope.getPlayLoad = function(abi, funName, paramArr) {
            var playLoadData = TxData(abi, funName, paramArr);
            return playLoadData;
        }


        $scope.mainToChild = function() {
            try {
                $scope.getNonce($scope.crossChain.id);
                const gasPrice = $scope.gasPrice * Math.pow(10, 9);
                const amount = web3.toWei($scope.toAmount, "ether");
                const childChainId = "child_" + (Number($scope.crossChain.id) - 1);
                var funcData = $scope.getPlayLoad(crossChainABI, "DepositInMainChain", [childChainId]);
                 var signRawObj = initSignBuildInContract(funcData, $scope.nonce, gasPrice, $scope.gasLimit, $scope.chain.chainId,amount);
                var signData = signTx($scope.currentPrivateKey, signRawObj);

                var obj = {};
                obj.chainId = $scope.chain.id;
                obj.signData = signData;
                var url = APIHost + "/sendTx";
                $http({
                    method: 'POST',
                    url: url,
                    data: obj
                }).then(function successCallback(res) {
                    if (res.data.result == "success") {
                        var depositeHash = res.data.data;
                        var objt = {};
                        objt.hash = depositeHash;
                        objt.nonce = $scope.nonce;
                        objt.fromaddress = $scope.account.address;
                        objt.value = $scope.toAmount;
                        objt.gas = $scope.gasLimit;
                        objt.gasPrice = gasPrice;
                        objt.chainId = $scope.chain.id;
                        objt.chainName = $scope.chain.name;
                        objt.crossChainId = $scope.crossChain.id;
                        objt.crossChainName = $scope.crossChain.name;
                        addMultiChainTransaction(objt).then(function(aobj) {
                            if (aobj.result == "success") {
                                $scope.checkMainTxInChildChain(depositeHash, $scope.crossChain.id, aobj.data, true,1);//aobj.data pid,true
                            }
                        })
                    } else {
                        swal("Error",res.data.error,"error");
                        removeLoading();
                    }

                }, function errorCallback(res) {
                    swal("Error","Internet error, please refresh the page","error");
                });

            } catch (e) {
                console.log(e);
                swal("Error",e.toString(),"error");
            }

        }



        $scope.confirmMainToChild = function(depositeHash, pid, flag,num) {
            let childChainId = "child_" + (Number($scope.crossChain.id) - 1);
            const gasPrice = $scope.gasPrice * Math.pow(10, 9);

            if($scope.pwdFormtype == 2){
                var secondChain = angular.copy($scope.currentResendSecondTx.chainId);
                childChainId = "child_" + ( secondChain- 1);
            }
            var funcData = $scope.getPlayLoad(crossChainABI, "DepositInChildChain", [childChainId, depositeHash]);
            var signRawObj = initSignRawCrosschain(funcData, $scope.nonce2, gasPrice, 0, childChainId);
            var signData = signTx($scope.currentPrivateKey, signRawObj);
            $scope.currentPrivateKey = "";

            if(num>30){
                if (flag) {
                    removeLoading();
                    queryMultiChainTxList($scope.account.address, $scope.chain.id).then(function(data) {
                        $scope.txList = data.data;
                        $scope.showTxDetail(pid,0);
                        $scope.$apply();
                        $('#transaction').modal('hide');
                        swal("Error","Trading congestion, please click resend","error");
                    })
                }
                return;
            }
            var obj2 = {};
            obj2.chainId = Number($scope.crossChain.id);
            if($scope.pwdFormtype == 2){
                obj2.chainId = Number($scope.currentResendSecondTx.chainId);
            }
            obj2.signData = signData;
            var url = APIHost + "/sendTx";
            $http({
                method: 'POST',
                url: url,
                data: obj2
            }).then(function successCallback(res) {
                removeLoading();
                if (res.data.result == "success") {

                    jQuery('#transaction').modal('hide');
                    var hash = depositeHash;
                    if($scope.pwdFormtype == 2){
                        hash = res.data.data;
                        jQuery('#resendTransaction').modal('hide');
                    }
                    var url = "index.html?key=" + hash + "&chain=" + $scope.chain.id;
                    if($scope.pwdFormtype == 2){
                        url = "index.html?key=" + hash + "&chain=" + $scope.currentResendSecondTx.chainId;
                    }
                    var html = '<a href="' + url + '" >Transaction hash:' + hash + '</a>';
                    successNotify(html);
                    if (flag) {
                        var objt = {};
                        objt.hash = res.data.data;
                        objt.nonce = $scope.nonce;
                        objt.fromaddress = $scope.account.address;
                        objt.value = $scope.toAmount;
                        objt.gas = $scope.gasLimit;
                        objt.gasPrice = $scope.gasLimit;
                        objt.chainId = $scope.chain.id;
                        objt.chainName = $scope.chain.name;
                        objt.crossChainId = $scope.crossChain.id;
                        objt.crossChainName = $scope.crossChain.name;
                        objt.pid = pid;
                        objt.status=1;
                        saveMultiChainChild3(objt).then(function(aobj) {
                            if (aobj.result == "success") {
                                queryMultiChainTxList($scope.account.address, $scope.chain.id).then(function(data) {
                                    $scope.txList = data.data;
                                    $scope.$apply();
                                })
                            }
                        })
                    }

                } else {
                    swal("Error",res.data.error,"error");
                }

            }, function errorCallback(res) {
                swal("Error","Internet error, please refresh the page","error");
            });
        }

        $scope.childToMainAmount;
        $scope.childToMain = function() {
            try {
                $scope.getNonce($scope.crossChain.id);
                const gasPrice = $scope.gasPrice * Math.pow(10, 9);
                const amount = web3.toWei($scope.toAmount, "ether");
                $scope.childToMainAmount = amount;
                const childChainId = "child_" + (Number($scope.chain.id) - 1);
                var funcData = $scope.getPlayLoad(crossChainABI, "WithdrawFromChildChain", [childChainId]);
                var signRawObj = initSignBuildInContract(funcData, $scope.nonce, gasPrice, $scope.gasLimit, $scope.chain.chainId,amount);
                var signData = signTx($scope.currentPrivateKey, signRawObj);
                var obj = {};
                obj.chainId = $scope.chain.id;
                obj.signData = signData;
                var url = APIHost + "/sendTx";
                $http({
                    method: 'POST',
                    url: url,
                    data: obj
                }).then(function successCallback(res) {
                    if (res.data.result == "success") {
                        var depositeHash = res.data.data;
                        var objt = {};
                        objt.hash = depositeHash;
                        objt.nonce = $scope.nonce;
                        objt.fromaddress = $scope.account.address;
                        objt.value = $scope.toAmount;
                        objt.gas = $scope.gasLimit;
                        objt.gasPrice = gasPrice;
                        objt.chainId = $scope.chain.id;
                        objt.chainName = $scope.chain.name;
                        objt.crossChainId = $scope.crossChain.id;
                        objt.crossChainName = $scope.crossChain.name;
                        addMultiChainTransaction(objt).then(function(aobj) {
                            if (aobj.result == "success") {
                                const type=2;
                                $scope.checkReceipt(depositeHash, $scope.chain.id, type, amount, aobj.data, false,1);
                            }
                        })
                    } else {
                        swal("Error",res.data.error,"error");
                        removeLoading();
                    }

                }, function errorCallback(res) {
                    swal("Error","Internet error, please refresh the page","error");
                });

            } catch (e) {
                console.log(e);
                swal("Error",e.toString(),"error");
            }

        }

        $scope.gasChanged = function() {
            $scope.gasPrice = jQuery("#gasPrice").val();

        }

        $scope.confirmChildToMain = function(depositeHash, childToMainAmount, pid,num) {
            const gasPrice = $scope.gasPrice * Math.pow(10, 9);
            let childChainId = "child_" + ($scope.chain.id - 1);
            if($scope.pwdFormtype == 2){
                var secondChain = angular.copy($scope.currentResendSecondTx.fromChainId);
                childChainId = "child_" + ( secondChain- 1);
            }
            var funcData = $scope.getPlayLoad(crossChainABI, "WithdrawFromMainChain", [childChainId, childToMainAmount, depositeHash]);
            var signRawObj = initSignRawCrosschain(funcData, $scope.nonce2, gasPrice, 0, "pchain");
            var signData = signTx($scope.currentPrivateKey, signRawObj);
            $scope.currentPrivateKey = "";

            if(num>30){
                removeLoading();
                queryMultiChainTxList($scope.account.address, $scope.chain.id).then(function(data) {
                    $scope.txList = data.data;
                    $scope.showTxDetail(pid,0);
                    $scope.$apply();
                    $('#transaction').modal('hide');
                    swal("Error","Trading congestion, please click resend","error");
                })
                return;
            }
            var obj2 = {};
            obj2.chainId = Number($scope.crossChain.id);
            if($scope.pwdFormtype == 2){
                obj2.chainId = Number($scope.currentResendSecondTx.chainId);
            }
            obj2.signData = signData;
            obj2.childId = Number($scope.chain.id);
            if($scope.pwdFormtype == 2){
                obj2.childId = Number($scope.currentResendSecondTx.fromChainId);
            }
            console.log(obj2)
            var url = APIHost + "/sendTx";
            $http({
                method: 'POST',
                url: url,
                data: obj2
            }).then(function successCallback(res) {
                removeLoading();
                if (res.data.result == "success") {

                    $('#transaction').modal('hide');
                    var hash = depositeHash;

                    if($scope.pwdFormtype == 2){
                        hash = res.data.data;
                        jQuery('#resendTransaction').modal('hide');
                    }
                    var url = "index.html?key=" + hash + "&chain=" + $scope.chain.id;
                    if($scope.pwdFormtype == 2){
                        url = "index.html?key=" + hash + "&chain=" + $scope.currentResendSecondTx.chainId;
                    }

                    var html = '<a href="' + url + '">Transaction hash:' + hash + '</a>';
                    successNotify(html);
                    var objt = {};
                    objt.hash = res.data.data;
                    objt.nonce = $scope.nonce;
                    objt.fromaddress = $scope.account.address;
                    objt.value = $scope.toAmount;
                    objt.gas = $scope.gasLimit;
                    objt.gasPrice = $scope.gasLimit;
                    objt.chainId = $scope.chain.id;
                    objt.chainName = $scope.chain.name;
                    objt.crossChainId = $scope.crossChain.id;
                    objt.crossChainName = $scope.crossChain.name;
                    objt.pid = pid;
                    objt.status = 1;
                    saveMultiChainChild3(objt).then(function(aobj) {
                        if (aobj.result == "success") {
                            queryMultiChainTxList($scope.account.address, $scope.chain.id).then(function(data) {
                                $scope.txList = data.data;
                                $scope.$apply();
                            })
                        }
                    })
                } else {
                    swal("Error",res.data.error,"error");
                }

            }, function errorCallback(res) {
                swal("Error","Internet error, please refresh the page","error");
            });

        }

        $scope.cutWords = function(words) {
         let result = words;
         if (words!=null && words.length > 12) {
             result = words.substr(0, 6) + "..." + words.substr(-6, 6);
         }
         return result;
     }


        $scope.keystorePath = "";
        $scope.keystoreJson;

        $scope.selectKeystore = function(){
            ipcRenderer.send('open-keystore-file');
        }

        ipcRenderer.on('selected-keystore',(event,path,fileJson)=>{
            if(fileJson.address && fileJson.crypto && fileJson.id){
                $scope.keystorePath = path;
                $scope.keystoreJson = fileJson;
                $scope.keystoreJson.address = "0x"+$scope.keystoreJson.address;
            }else{
                $scope.keystorePath = "";
                $scope.keystoreJson = "";
                swal("Error","Incorrect Format Keystore","error");
            }
            $scope.$apply();
        })

        $scope.importKeystoreFile = function(){
            const eWallet = require('ethereumjs-wallet');
            try{
                const keystoreInstance = eWallet.fromV3($scope.keystoreJson,$scope.keystorePassword);
                let newPrivateKey = keystoreInstance.getPrivateKey().toString("hex");
                var enPri = AESEncrypt(newPrivateKey,$scope.keystorePassword);
                $scope.keystorePassword = "";

                importAccount(enPri,$scope.keystoreJson.address).then(function (resObj) {
                    if(resObj.result=="success"){
                        showPopup("Import Keystore Successfully",1000);
                        $('#importKeystore').modal('hide');                      
                        $scope.keystoreJson = "";
                        $scope.keystorePath = "";
                        var obj = {};
                        obj.address = priToAddress(newPrivateKey);
                        $scope.accountList.push(obj);

                        if($scope.accountList.length> 0){
                            $scope.account = $scope.accountList[$scope.accountList.length-1];
                        }
                        $scope.getBalance();
                    }
                }).catch(function (e) {
                    showPopup(e.error,1000);
                })
            }catch(e){
                console.log(e);
                swal("Import Error",e.toString(),"error");
            }
        }



    });
    $(function() {
        menuActive(2);
    });