import React, { createContext, useReducer, useContext } from 'react';

const AppStateContext = createContext();
const AppDispatchContext = createContext();

const initialState = {
  user: null,
  token: null,
  activeOrgId: null,
  role: null,
  enabledModules: [],
  needsOrgSelection: false,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        activeOrgId: action.payload.activeOrgId,
        role: action.payload.role,
        enabledModules: action.payload.enabledModules,
        needsOrgSelection: action.payload.needsOrgSelection,
      };
 case 'LOGOUT':
  return {
    user: null,
    token: null,
    activeOrgId: null,
    role: null,
    enabledModules: [],
    needsOrgSelection: false,
  };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);
