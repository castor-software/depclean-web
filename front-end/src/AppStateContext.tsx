import React, { createContext, useReducer, useContext, useState } from "react";
import {
    filterArtifacts, getTreeHierarchy, cloneProject,
    highlightBloat, debloatDirect, debloatAll,
    filterArifactByType
} from "./utils/treeAccess";
// import { fetchFromFile } from './utils/dataRetrieve';
import { artifact, AppState, Action, AppStateContextProps } from 'src/interfaces/interfaces';
import { hierarchy } from 'd3';
import { childrenAccessor } from 'src/accessors/treeAccessors';
import { dependCheckGroup, bloatedCheckGroup, scopeCheckGroup, appData } from 'src/Components/appStateContext';


//REDUCER
const appStateReducer = (state: AppState, action: Action): AppState => {

    switch (action.type) {
        case "FILTER_USED_DEPENDENCIES": {
            //CLONE the filtered project
            //filter all the children necessary
            const filteredProject: artifact = cloneProject(state.filteredProject);
            filteredProject.children = filterArifactByType(state.filteredProject.children, state.filteredScope, action.payload, "used");
            return {
                ...state,
                filteredDependencies: action.payload,
                filteredProject: filteredProject,
                filtered: getTreeHierarchy(filteredProject, childrenAccessor)
            }
        }

        case "FILTER_BLOATED_DEPENDENCIES": {
            //CLONE the filtered project
            //filter all the children necessary
            const filteredProject: artifact = cloneProject(state.filteredProject);
            filteredProject.children = filterArifactByType(state.filteredProject.children, state.filteredScope, action.payload, "bloated");
            return {
                ...state,
                filteredBloated: action.payload,
                filteredProject: filteredProject,
                filtered: getTreeHierarchy(filteredProject, childrenAccessor)
            }
        }
        case "SELECT_DEPENDENCY": {
            //set the filters
            const filteredProject: artifact = cloneProject(state.filteredProject);
            filteredProject.children = filterArtifacts(state.filteredProject.children, state.filteredScope, action.payload);
            // state.filtered = getTreeHierarchy(filteredProject, childrenAccessor);
            return {
                ...state,
                filteredDependencies: action.payload,
                filteredProject: filteredProject,
                filtered: getTreeHierarchy(filteredProject, childrenAccessor)

            }
        }

        case "SELECT_BLOAT": {
            const filteredProject: artifact = cloneProject(state.filteredProject);
            filteredProject.children = highlightBloat(filteredProject.children, action.payload);
            // state.filtered = getTreeHierarchy(state.filteredProject, childrenAccessor);

            return {
                ...state,
                filteredBloated: action.payload,
                filteredProject: filteredProject,
                filtered: getTreeHierarchy(state.filteredProject, childrenAccessor)

            }
        }

        case "SELECT_SCOPE": {
            const filteredScope = [...action.payload, "provided", "runtime", "system"];
            const filteredProject: artifact = cloneProject(state.filteredProject);
            filteredProject.children = filterArtifacts(filteredProject.children, filteredScope, state.filteredDependencies);
            // state.filtered = getTreeHierarchy(state.filteredProject, childrenAccessor);

            return {
                ...state,
                filteredScope: filteredScope,
                filteredProject: filteredProject,
                filtered: getTreeHierarchy(state.filteredProject, childrenAccessor)

            }
        }

        case "SELECT_VIEW": {
            return {
                ...state,
                textDisplay: action.payload
            }
        }
        case "SELECT_COLOR": {
            return {
                ...state,
                colorSelected: action.payload
            }
        }
        case "LOAD_LOCAL_FILE": {
            // state.project = action.payload;
            // state.filteredProject = cloneProject(action.payload);
            const newNodes = hierarchy(action.payload, childrenAccessor);
            // state.nodes = newNodes;
            // state.filtered = newNodes;
            return {
                ...state,
                project: action.payload,
                filteredProject: cloneProject(action.payload),
                nodes: newNodes,
                filtered: newNodes,
            }
        }

        case "RESET_FILTERS": {
            return {
                ...state,
                filteredDependencies: dependCheckGroup,
                filteredBloated: bloatedCheckGroup,
                colorSelected: "NONE",
                filteredScope: scopeCheckGroup,
                viewOmitted: true,
                debloatNum: 0,
            }
        }

        case "FILTER_ALL": {
            const filteredProject: artifact = cloneProject(state.filteredProject);
            filteredProject.children = filterArifactByType(state.filteredProject.children, state.filteredScope, state.filteredDependencies, "used");
            filteredProject.children = filterArifactByType(state.filteredProject.children, state.filteredScope, state.filteredBloated, "bloated");
            return {
                ...state,
                filteredProject: filteredProject,
                filtered: getTreeHierarchy(filteredProject, childrenAccessor)
            }
        }
        case "VIEW_OMITTED": {
            return {
                ...state,
                viewOmitted: action.payload
            }
        }
        case "VIEW_LINKS": {
            return {
                ...state,
                viewLinks: action.payload
            }
        }
        case "SET_MESSAGE": {
            return {
                ...state,
                messageState: action.payload
            }
        }
        case "DEBLOAT_PROJECT": {

            let messageState: "ORIGINAL" | "DEBLOAT_DIRECT" | "DEBLOAT_ALL" = "ORIGINAL";
            const projectDebloated: artifact = cloneProject(state.project);

            switch (action.payload) {
                case 0:
                    messageState = "ORIGINAL";
                    projectDebloated.children = state.project.children;
                    break;
                case 50:
                    messageState = "DEBLOAT_DIRECT";
                    projectDebloated.children = debloatDirect(projectDebloated.children);
                    // code block
                    break;
                case 100:
                    messageState = "DEBLOAT_ALL";
                    projectDebloated.children = debloatAll(projectDebloated.children, ["direct", "transitive"]);
                    // code block
                    break;
                default:
                    messageState = "ORIGINAL";
                // code block
            }

            const filteredDebloated = getTreeHierarchy(projectDebloated, childrenAccessor);


            return {
                ...state,
                debloatNum: action.payload,
                filteredProject: projectDebloated,
                filtered: filteredDebloated,
                messageState: messageState
            }
        }


        default: {
            console.log("DEFAULT")
            return state
        }

    }
}

//A
const AppStateContext = createContext<AppStateContextProps>({} as AppStateContextProps);

//Retrieve the value from AppStateContext using
//usecontext hook and return the result
export const useAppState = () => {
    return useContext(AppStateContext);
}



export const AppStateProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [state, dispatch] = useReducer(appStateReducer, appData)
    const [viewMenu, setViewMenu] = useState(false);
    return (
        <AppStateContext.Provider value={{ state, dispatch, viewMenu, setViewMenu }}>
            {children}
        </AppStateContext.Provider>
    )
}