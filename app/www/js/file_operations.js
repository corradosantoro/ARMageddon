'use strict';

var FileOperations = {

    open : function(_fun_) {
        var chosenFileEntry = null;

        var accepts = [{
            extensions: ['bin']
        }];

        // load up the file
        chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function (fileEntry) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
            }

            if (!fileEntry) {
                console.log('No file selected, restore aborted.');
                return;
            }

            chosenFileEntry = fileEntry;

            // echo/console log path specified
            // chrome.fileSystem.getDisplayPath(chosenFileEntry, function (path) {
            //     console.log('Restore file path: ' + path);
            // });

            // read contents into variable
            chosenFileEntry.file(function (file) {
                var reader = new FileReader();

                reader.onprogress = function (e) {
                    if (e.total > 1048576) { // 1 MB
                        // dont allow reading files bigger then 1 MB
                        console.log('File limit (1 MB) exceeded, aborting');
                        reader.abort();
                    }
                };

                reader.onloadend = function (e) {
                    if (e.total != 0 && e.total == e.loaded) {
                        //console.log('Read SUCCESSFUL');
                        //console.log(e.target.result);
                        _fun_(array_to_uint(new Int8Array(e.target.result)));
                    }
                };

                reader.readAsArrayBuffer(file);

            });
        });
    },

};
