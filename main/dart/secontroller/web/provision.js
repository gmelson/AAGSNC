
function ProvisionCtrl($scope, $http) {
    $scope.persoError = '';
    $scope.isBusy = false;
    $scope.msdnText = '';
    $scope.aidText = 'A0000003964D66344D0002';
    $scope.seidText = '47902207029320961688';
    $scope.fromDomainText = 'http://192.168.155.130:8280';
    $scope.toDomainText = 'http://192.168.150.176:8280';
    $scope.serviceQualifierText = '300:1002111111111111';
    $scope.operationCodeText = '1';
    $scope.serviceIdText = '301';

    $scope.addMSDN = function() {
        if($scope.msdnText == 'undefined'|| $scope.msdnText == ''){
            $scope.persoError = 'Please provide a valid phone number';
        }
        $scope.msdn = $scope.msdnText;
        $scope.msdnText = '';
        $scope.isBusy = 'true';
        $scope.step = 1;

        var postObj = new Object();
        postObj.msdn = $scope.msdn;
        postObj.aid = $scope.aidText;
        postObj.seid = $scope.seidText;
        postObj.from = $scope.fromDomainText;
        postObj.to = $scope.toDomainText;
        postObj.serviceQualifier = $scope.serviceQualifierText;
        postObj.operationCode =  $scope.operationCodeText;
        postObj.serviceId = $scope.serviceIdText;

        $http({
            method: 'POST',
            url: 'http://sqsw-0803-gm.sequent.local:8380/mifare',
            data: postObj,
            headers:{'Content-Type' : 'application/x-www-form-urlencoded'}
        }).
            success(function(data){
                $scope.step = 1;
            }).
            error(function(data, status){
                $scope.persoError = status;
                $scope.msdn = '';
            });


    };

}
