var azure = require('azure');

var createResourceName = function(containerName, blobName, skipEncoding) {
  var resourceName;
  if (!skipEncoding) {
    if (blobName) {
      blobName = encodeURIComponent(blobName);
      blobName = blobName.replace(/%2F/g, '/');
      blobName = blobName.replace(/%5C/g, '/');
      blobName = blobName.replace(/\+/g, '%20');
    }
  }
  resourceName = containerName + '/' + blobName;
  if (!containerName || containerName === '$root') {
    resourceName = blobName;
  }
  if (!blobName) {
    resourceName = containerName;
  }
  return resourceName;
};

var getDate = (function(_this) {
  return function() {
    var date;
    date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  };
})(this);

var ware = {
  _initialized: false,
  _blobService: undefined,
  setup: function() {
    var serviceProperties = {
      Cors: {
        CorsRule: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: ['GET', 'PUT'],
            AllowedHeaders: ['*'],
            ExposedHeaders: ['*'],
            MaxAgeInSeconds: 1800
          }
        ]
      }
    };

    this._blobService = azure.createBlobService();
    this._blobService.createContainerIfNotExists('container', {
      publicAccessLevel: 'blob'
    }, function(error) {return});
    this._blobService.setServiceProperties(serviceProperties, function(err, res, resp) {return});
    this._initialized = true;
  },
  getSASURL: function(req, res) {
    if (!this._initialized)
      this.setup();
    var fileName = req.params.file_name;
    var url = this._blobService.generateSharedAccessSignature("container", fileName, {
        AccessPolicy : {
          Permissions : "rwdl",
          Expiry : getDate()
        }
      }
    );
    // Can improve process: https://github.com/Azure/azure-storage-node#queue-storage
    var resourceName = createResourceName('container', fileName);
    var fullPath = this._blobService.host.primaryHost + resourceName + '?' + url;
    res.send({url: fullPath});
  }

module.exports = ware;