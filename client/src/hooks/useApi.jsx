import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Simplified useApi hook to replace the deleted comprehensive version
const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    apiType = "firebase",
    firebaseOperation = "get",
    firebaseFilters = [],
    executeOnMount = true,
    onSuccess,
    onError,
    transform
  } = options;

  const execute = async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      let result = null;

      if (apiType === "firebase") {
        if (firebaseOperation === "get") {
          // Handle document get
          const docRef = doc(firestore, endpoint);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            result = { id: docSnap.id, ...docSnap.data() };
          } else {
            throw new Error("Document not found");
          }
        } else if (firebaseOperation === "list") {
          // Handle collection query
          const collectionRef = collection(firestore, endpoint);
          let q = collectionRef;

          // Apply filters
          firebaseFilters.forEach(filter => {
            q = query(q, where(filter.field, filter.operator, filter.value));
          });

          const querySnapshot = await getDocs(q);
          result = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      }

      // Transform data if transform function provided
      if (transform && result) {
        result = transform(result);
      }

      setData(result);
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err);
      setIsSuccess(false);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (executeOnMount) {
      execute();
    }
  }, [endpoint, executeOnMount]);

  return {
    data,
    loading,
    error,
    isSuccess,
    execute,
    refetch: execute
  };
};

export default useApi;