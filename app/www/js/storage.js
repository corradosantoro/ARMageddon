'use strict';

function save() {
    var chosenFileEntry = null;

    var prefix = 'backup';
    var suffix = 'json';

    var filename = 'mysong.gss';

    // create or load the file
    chrome.fileSystem.chooseEntry({type: 'saveFile',
                                   suggestedName: filename,
                                   accepts: [ { description: 'Song files (*.gss)',
                                                extensions: ['gss']} ]
                                  },
                                  function (fileEntry) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
        }

        if (!fileEntry) {
            console.log('No file selected, backup aborted.');
            return;
        }

        chosenFileEntry = fileEntry;

                                      Song.setName(chosenFileEntry.name);

        // echo/console log path specified
        // chrome.fileSystem.getDisplayPath(chosenFileEntry, function (path) {
        //     console.log('Backup file path: ' + path);
        // });

        // change file entry from read only to read/write
        chrome.fileSystem.getWritableEntry(chosenFileEntry, function (fileEntryWritable) {
            // check if file is writable
            chrome.fileSystem.isWritableEntry(fileEntryWritable, function (isWritable) {
                if (isWritable) {
                    chosenFileEntry = fileEntryWritable;

                    // crunch the config object
                    var serialized_config_object = to_string();
                    var blob = new Blob([serialized_config_object], {type: 'text/plain'});
                    // first parameter for Blob needs to be an array

                    chosenFileEntry.createWriter(function (writer) {
                        writer.onerror = function (e) {
                            console.error(e);
                        };

                        var truncated = false;
                        writer.onwriteend = function () {
                            if (!truncated) {
                                // onwriteend will be fired again when truncation is finished
                                truncated = true;
                                writer.truncate(blob.size);

                                return;
                            }

                            //console.log('Write SUCCESSFUL');
                        };

                        writer.write(blob);
                    }, function (e) {
                        console.error(e);
                    });
                } else {
                    // Something went wrong or file is set to read only and cannot be changed
                    console.log('File appears to be read only, sorry.');
                }
            });
        });
    });
}


function load() {
    var chosenFileEntry = null;

    var accepts = [{
        extensions: ['gss']
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
                    var song_data;
                    //console.log('Read SUCCESSFUL');

                    try { // check if string provided is a valid JSON
                        song_data = JSON.parse(e.target.result);
                        //song_data = JSON.parse(song_data); // double parse since data is "over-stringified"
                    } catch (e) {
                        // data provided != valid json object
                        console.log('Data provided != valid JSON string, restore aborted.');

                        return;
                    }
                    //console.log(song_data);

                    from_string(song_data);
                }
            };

            reader.readAsText(file);

        });
    });

}
