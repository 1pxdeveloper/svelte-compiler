export const _GET = (id) => (collection) => collection.byId[id];

export const _DELETE = (doc) => (collection) => ({
    ...collection,
    allIds: collection.allIds.filter(id => id !== doc.id)
})

export const _FETCH = o => o.allIds.map(id => o.byId[id]);

export const _POST = (doc) => (collection) => {
    doc.id = Math.random().toString(36).slice(2);
    collection.byId[doc.id] = doc;
    collection.allIds.push(doc.id);
    return collection;
}

export const _PUT = (doc) => !doc.id ? _POST(doc) : (collection) => {
    collection.byId[doc.id] = doc;
    return collection;
}