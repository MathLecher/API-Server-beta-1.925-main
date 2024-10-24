import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let requestsCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");  // Repository?

// Repository file data models cache
global.requestsCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
    static startCachedRequestsCleaner() {
        // periodic cleaning of expired cached repository data
        setInterval(CachedRequestsManager.flushExpired, requestsCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests data caches cleaning process started...]");

    }
    static add(request, data, ETag) {
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (request != "") {
            CachedRequestsManager.clear(request);
            requestsCaches.push({
                request,
                data,
                ETag,
                Expire_Time: utilities.nowInSeconds() + requestsCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${request} requests has been cached]`);
        }
    }
    static find(request) {
        try {
            if (request != "") {
                for (let cache of requestsCaches) {
                    if (cache.request == request) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + requestsCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.request} data retrieved from cache]`);
                        return cache.data;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[requests cache error!]", error);
        }
        return null;
    }
    static clear(request) {
        if (request != "") {
            requestsCaches = requestsCaches.filter(caches=> caches.request != request);
        }
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestsCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.request + ".json expired");
            }
        }
        requestsCaches = requestsCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {
        if(HttpContext!=undefined){
            for(let cache of requestsCaches){
                let data = CachedRequestsManager.find(HttpContext.path.queryString)
                if(data != null){
                    HttpContext.response.JSON(cache.data,cache.ETag,true);
                    return true;
                }
            }
        }
        return false;
        
    }

}