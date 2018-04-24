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

    _beforeInsert(data) {
        return Promise.resolve(data);
    }
    
    _afterInsert(id) {
        return Promise.resolve(id);
    }
    
    _beforeUpdate(data) {
        return Promise.resolve(data);
    }
    
    _afterUpdate(id) {
        return Promise.resolve(id);
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
            select: []
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
        var now = new Date();

        return this._pre(data)
            .then((validData) => {
                return this._beforeInsert(validData);
            })
            .then((processedData) => {
                processedData._createdDate = now;

                return this.collection.insert(processedData);
            })
            .then((id) => {
                return this._afterInsert(id);
            });
    }

    update(data) {
        return this._pre(data)
        
            .then((validData) => {
                return this._beforeUpdate(validData);
            })
            .then((processedData) => {
                return this.collection.update(processedData);
            })
            .then((id) => {
                return this._afterUpdate(id);
            }); 
    }

    delete(data) {
        data._deleted = true;
        data._updatedDate = new Date();
        return this.collection.update(data);
    }

    destroy(id) {
        return this.collection.deleteOne({
                _id: ObjectId.isValid(id) ? new ObjectId(id) : {}
            })
            .then((result) => {
                return Promise.resolve(result.deletedCount === 1);
            });
    } 

    getSingleById(id, fields) {
        var query = {
            _id: ObjectId.isValid(id) ? new ObjectId(id) : {},
            _deleted: false
        };
        return this.getSingleByQuery(query, fields);
    }

    getSingleByIdOrDefault(id, fields) {
        var query = {
            _id: ObjectId.isValid(id) ? new ObjectId(id) : {},
            _deleted: false
        }; 
        return this.getSingleByQueryOrDefault(query, fields);
    }

    getSingleByQuery(where, fields) {
        this.collection.select(fields);
        return this.collection.single(where);
    }

    getSingleByQueryOrDefault(where, fields) {
        this.collection.select(fields);
        return this.collection.singleOrDefault(where);
    }
};
