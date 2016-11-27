"use strict";
// external deps
var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");

module.exports = class BaseManager {
    constructor(db, user, locale) {
        this.db = db;
        this.user = user;
        this.locale = locale;

        this.collection = null;
    }

    _validate(data) {
        throw new Error("_validate(data) not implemented");
    }

    _getQuery(paging) {
        throw new Error("_getQuery(paging) not implemented");
    }

    _createIndexes() {
        return Promise.resolve(true);
    }


    read(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: {},
            filter: {},
            asc: true
        }, paging);
        // var start = process.hrtime();

        return this._createIndexes()
            .then((createIndexResults) => {
                var query = this._getQuery(_paging);
                return this.collection
                    .where(query)
                    .select(_paging.select)
                    .page(_paging.page, _paging.size)
                    .order(_paging.order)
                    .execute();
            });
    }

    _pre(data) {
        return this._createIndexes()
            .then((createIndexResults) => {
                return this._validate(data);
            });
    }

    create(data) {
        return this._pre(data)
            .then((validData) => {
                return this.collection.insert(validData);
            });
    }

    update(data) {
        return this._pre(data)
            .then((validData) => {
                return this.collection.update(validData);
            });
    }

    delete(data) {
        return this._pre(data)
            .then((validData) => {
                validData._deleted = true;
                return this.collection.update(validData);
            });
    }

    destroy(id) {
        if (!ObjectId.isValid(id)) {
            return Promise.resolve(null);
        }
        else {
            return this.collection.deleteOne({
                _id: id
            })
                .then((result) => {
                    return result.n === 1;
                })
                .catch((e) => {

                    throw e;
                });
        }
    }

    getSingleById(id) {
        if (!ObjectId.isValid(id)) {
            return Promise.resolve(null);
        }
        else {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            return this.getSingleByQuery(query);
        }
    }

    getSingleByIdOrDefault(id) {
        if (!ObjectId.isValid(id)) {
            return Promise.resolve(null);
        }
        else {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            return this.getSingleByQueryOrDefault(query);
        }
    }

    getSingleByQuery(query) {
        return this.collection.single(query);
    }

    getSingleByQueryOrDefault(query) {
        return this.collection.singleOrDefault(query);
    }
};
