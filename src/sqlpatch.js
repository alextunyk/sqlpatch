/* jshint node: true */

module.exports = sqlpatch;

var fs = require('fs');
var path = require('path');
var pkg = require('../package');
var toposort = require('toposort');
var extend = require('util')._extend;
var Mustache = require('mustache');

function sqlpatch(fileList, writer, options) {

    options = extend({
        dialect: 'postgres'
    }, options);

    var template = fs.readFileSync(__dirname + '/' + options.dialect + '.sql').toString();
    var model = {
        pkg: pkg
    };

    var fileInfoList = fileList.map(readFileInfo).map(function(item) {
        if ('name' in item.properties && item.properties.name.length >= 1) item.name = item.properties.name[0];
        else item.name = path.basename(item.file, '.sql');
        return item;
    });
    var fileInfoMap = fileInfoList.reduce(function(map, item) {
        if (item.name in map) throw new Error("duplicate name '" + item.name + "'");
        map[item.name] = item;
        return map;
    }, {});

    var nameList = Object.keys(fileInfoMap);
    var nameEdgeList = nameList.reduce(function(list, name) {
        var fileInfoItem = fileInfoMap[name];
        if ('require' in fileInfoItem.properties) {
            fileInfoItem.properties.require.
            filter(function(dependencyName) {
                return ~nameList.indexOf(dependencyName);
            }).
            forEach(function(dependencyName) {
                list.push([name, dependencyName]);
            });
        }
        return list;
    }, []);

    var dependencyList = toposort.array(nameList, nameEdgeList);

    dependencyList.reverse();

    model.patches = dependencyList.map(function(name, index) {
        var fileInfoItem = fileInfoMap[name];

        return fileInfoItem;
    }).
    filter(function(item) {
        return item;
    }).
    map(function(item, index) {
        var number = index + 1;

        item.number = number;

        return item;
    });

    writer.write(Mustache.render(template, model));
}

function readFileInfo(file) {
    var content = fs.readFileSync(file).toString().replace(/(^\s+|\s+$|)/g, "");
    var properties = readProperties(content);
    return {
        file: file,
        content: content,
        properties: properties,
    };
}

function readProperties(content) {
    var result = {};
    var match;
    var re = /^\s*\-\-\s*@(.+?)\s+(.+?)\s*$/gm;
    while ((match = re.exec(content))) {
        if (match[1] in result) result[match[1]].push(match[2]);
        else result[match[1]] = [match[2]];
    }
    return result;
}