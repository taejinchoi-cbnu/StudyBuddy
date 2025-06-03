import { useCallback, useRef } from "react";
import useAsyncState from "./useAsyncState";

/**
 * 통합 API 관리 훅
 * REST API, Firebase, GraphQL 등 모든 API 호출을 통합 관리
 * 
 * @param {string} endpoint - API 엔드포인트 또는 Firebase 컬렉션 경로
 * @param {Object} options - API 옵션들
 * @returns {Object} API 상태와 제어 함수들
 */
const useApi = (endpoint, options = {}) => {
  const {
    method = "GET",
    baseURL = "",
    headers = {},
    params = {},
    body = null,
    apiType = "rest", // 'rest', 'firebase', 'graphql'
    
    // Firebase 관련 옵션들
    firebaseOperation = "get", // 'get', 'list', 'add', 'update', 'delete'
    firebaseFilters = [],
    firebaseOrderBy = null,
    firebaseLimit = null,
    
    // GraphQL 관련 옵션들
    query = "",
    variables = {},
    
    // 캐싱 옵션들
    enableCache = true,
    cacheKey = null,
    cacheDuration = 5 * 60 * 1000, // 5분
    
    // 실행 옵션들
    executeOnMount = true,
    retryCount = 3,
    retryDelay = 1000,
    
    // 콜백들
    onSuccess,
    onError,
    transform,
    
    // 기타
    showNotifications = true,
  } = options;

  const abortControllerRef = useRef(null);

  // Firebase API 함수들 (실제 구현은 별도 서비스에서)
  const firebaseApiCall = useCallback(async ({ signal }) => {
    const { firestore } = await import("../firebase");
    const { 
      collection, 
      doc, 
      getDocs, 
      getDoc, 
      addDoc, 
      updateDoc, 
      deleteDoc, 
      query, 
      where, 
      orderBy, 
      limit 
    } = await import("firebase/firestore");

    switch (firebaseOperation) {
      case "list": {
        let q = collection(firestore, endpoint);
        
        // 필터 적용
        firebaseFilters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
        
        // 정렬 적용
        if (firebaseOrderBy) {
          q = query(q, orderBy(firebaseOrderBy.field, firebaseOrderBy.direction || "asc"));
        }
        
        // 제한 적용
        if (firebaseLimit) {
          q = query(q, limit(firebaseLimit));
        }
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      case "get": {
        const docRef = doc(firestore, endpoint);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        throw new Error("문서를 찾을 수 없습니다.");
      }
      
      case "add": {
        const collectionRef = collection(firestore, endpoint);
        const docRef = await addDoc(collectionRef, body);
        return { id: docRef.id, ...body };
      }
      
      case "update": {
        const docRef = doc(firestore, endpoint);
        await updateDoc(docRef, body);
        return body;
      }
      
      case "delete": {
        const docRef = doc(firestore, endpoint);
        await deleteDoc(docRef);
        return { success: true };
      }
      
      default:
        throw new Error(`지원하지 않는 Firebase 작업: ${firebaseOperation}`);
    }
  }, [endpoint, firebaseOperation, firebaseFilters, firebaseOrderBy, firebaseLimit, body]);

  // REST API 함수
  const restApiCall = useCallback(async ({ signal }) => {
    const url = new URL(endpoint, baseURL);
    
    // 쿼리 파라미터 추가
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    const requestOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal,
    };

    // GET이 아닌 경우 body 추가
    if (method !== "GET" && body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), requestOptions);
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    
    return await response.text();
  }, [endpoint, baseURL, method, headers, params, body]);

  // GraphQL API 함수
  const graphqlApiCall = useCallback(async ({ signal }) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`GraphQL 요청 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors.map(error => error.message).join(", "));
    }

    return result.data;
  }, [endpoint, headers, query, variables]);

  // API 타입에 따른 함수 선택
  const getApiFunction = useCallback(() => {
    switch (apiType) {
      case "firebase":
        return firebaseApiCall;
      case "graphql":
        return graphqlApiCall;
      case "rest":
      default:
        return restApiCall;
    }
  }, [apiType, firebaseApiCall, graphqlApiCall, restApiCall]);

  // useAsyncState를 사용한 API 상태 관리
  const apiState = useAsyncState(
    getApiFunction(),
    [endpoint, method, JSON.stringify(params), JSON.stringify(body)],
    {
      enabled: executeOnMount,
      onSuccess,
      onError,
      transform,
      showNotifications,
      retryCount,
      retryDelay,
      cacheDuration,
    }
  );

  // 수동 API 호출 (다른 파라미터로)
  const callApi = useCallback(async (overrideOptions = {}) => {
    const { 
      method: newMethod = method,
      params: newParams = params,
      body: newBody = body,
      ...otherOptions 
    } = overrideOptions;

    // 새로운 API 함수 생성
    let apiFunction;
    
    if (apiType === "firebase") {
      apiFunction = firebaseApiCall;
    } else if (apiType === "graphql") {
      apiFunction = graphqlApiCall;
    } else {
      // REST API - 파라미터 오버라이드
      apiFunction = async ({ signal }) => {
        const url = new URL(endpoint, baseURL);
        
        Object.keys(newParams).forEach(key => {
          url.searchParams.append(key, newParams[key]);
        });

        const requestOptions = {
          method: newMethod,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          signal,
        };

        if (newMethod !== "GET" && newBody) {
          requestOptions.body = JSON.stringify(newBody);
        }

        const response = await fetch(url.toString(), requestOptions);
        
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        }
        
        return await response.text();
      };
    }

    return await apiFunction({ signal: abortControllerRef.current?.signal });
  }, [endpoint, baseURL, method, headers, params, body, apiType, firebaseApiCall, graphqlApiCall]);

  // 특별한 HTTP 메소드들을 위한 헬퍼 함수들
  const apiHelpers = {
    get: useCallback((newParams = {}) => {
      return callApi({ method: "GET", params: { ...params, ...newParams } });
    }, [callApi, params]),

    post: useCallback((data = {}) => {
      return callApi({ method: "POST", body: data });
    }, [callApi]),

    put: useCallback((data = {}) => {
      return callApi({ method: "PUT", body: data });
    }, [callApi]),

    patch: useCallback((data = {}) => {
      return callApi({ method: "PATCH", body: data });
    }, [callApi]),

    delete: useCallback(() => {
      return callApi({ method: "DELETE" });
    }, [callApi]),
  };

  // Firebase 특별 헬퍼들
  const firebaseHelpers = {
    getById: useCallback((id) => {
      return callApi({ 
        firebaseOperation: "get",
        endpoint: `${endpoint}/${id}` 
      });
    }, [callApi, endpoint]),

    create: useCallback((data) => {
      return callApi({ 
        firebaseOperation: "add",
        body: data 
      });
    }, [callApi]),

    updateById: useCallback((id, data) => {
      return callApi({ 
        firebaseOperation: "update",
        endpoint: `${endpoint}/${id}`,
        body: data 
      });
    }, [callApi, endpoint]),

    deleteById: useCallback((id) => {
      return callApi({ 
        firebaseOperation: "delete",
        endpoint: `${endpoint}/${id}` 
      });
    }, [callApi, endpoint]),

    query: useCallback((filters = [], orderBy = null, limit = null) => {
      return callApi({
        firebaseOperation: "list",
        firebaseFilters: filters,
        firebaseOrderBy: orderBy,
        firebaseLimit: limit,
      });
    }, [callApi]),
  };

  // 요청 취소
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 페이지네이션 헬퍼
  const paginationHelpers = {
    loadMore: useCallback(async (lastItem = null) => {
      if (apiType === "firebase") {
        // Firebase 페이지네이션
        const filters = [...firebaseFilters];
        if (lastItem && firebaseOrderBy) {
          filters.push({
            field: firebaseOrderBy.field,
            operator: firebaseOrderBy.direction === "desc" ? "<" : ">",
            value: lastItem[firebaseOrderBy.field]
          });
        }
        
        return await firebaseHelpers.query(filters, firebaseOrderBy, firebaseLimit);
      } else {
        // REST API 페이지네이션
        const newParams = { ...params };
        if (lastItem) {
          newParams.cursor = lastItem.id;
        }
        return await apiHelpers.get(newParams);
      }
    }, [apiType, firebaseFilters, firebaseOrderBy, firebaseLimit, firebaseHelpers, params, apiHelpers]),

    loadPage: useCallback(async (page = 1, pageSize = 10) => {
      if (apiType === "firebase") {
        return await firebaseHelpers.query(
          firebaseFilters, 
          firebaseOrderBy, 
          pageSize
        );
      } else {
        return await apiHelpers.get({
          page,
          limit: pageSize,
        });
      }
    }, [apiType, firebaseHelpers, firebaseFilters, firebaseOrderBy, apiHelpers]),
  };

  // 실시간 업데이트 (Firebase 전용)
  const subscribeToUpdates = useCallback((callback) => {
    if (apiType !== "firebase") {
      console.warn("실시간 업데이트는 Firebase에서만 지원됩니다.");
      return () => {};
    }

    import("../firebase").then(({ firestore }) => {
      import("firebase/firestore").then(({ collection, onSnapshot, query, where, orderBy, limit }) => {
        let q = collection(firestore, endpoint);
        
        // 필터 적용
        firebaseFilters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
        
        // 정렬 적용
        if (firebaseOrderBy) {
          q = query(q, orderBy(firebaseOrderBy.field, firebaseOrderBy.direction || "asc"));
        }
        
        // 제한 적용
        if (firebaseLimit) {
          q = query(q, limit(firebaseLimit));
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(data);
        });
        
        return unsubscribe;
      });
    });
  }, [apiType, endpoint, firebaseFilters, firebaseOrderBy, firebaseLimit]);

  return {
    // 기본 상태 (useAsyncState에서 제공)
    ...apiState,

    // API 호출 함수들
    callApi,
    cancelRequest,

    // HTTP 메소드 헬퍼들
    ...apiHelpers,

    // Firebase 헬퍼들 (Firebase API일 때만)
    ...(apiType === "firebase" ? firebaseHelpers : {}),

    // 페이지네이션 헬퍼들
    ...paginationHelpers,

    // 실시간 업데이트 (Firebase만)
    subscribeToUpdates,

    // 편의 기능들
    isRest: apiType === "rest",
    isFirebase: apiType === "firebase",
    isGraphQL: apiType === "graphql",

    // 상태 확인
    hasData: !!apiState.data,
    isFirstLoad: !apiState.lastFetch,
    
    // 요청 정보
    endpoint,
    method,
    apiType,
  };
};

export default useApi;