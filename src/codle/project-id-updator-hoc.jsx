import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {setProjectId} from '../reducers/project-state';

/* Higher Order Component to update the project ID in the store when it changes.
 * @param {React.Component} WrappedComponent component to receive project ID update behavior
 * @returns {React.Component} component with project ID update behavior
 */
const ProjectIdUpdatorHOC = function (WrappedComponent) {
    class ProjectIdUpdatorComponent extends React.Component {
        componentDidUpdate (prevProps) {
            if (this.props.projectId !== prevProps.projectId) {
                this.props.setProjectId(this.props.projectId);
            }
        }
        render () {
            return (
                <WrappedComponent {...this.props} />
            );
        }
    }
    ProjectIdUpdatorComponent.propTypes = {
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func
    };
    const mapDispatchToProps = dispatch => ({
        setProjectId: projectId => {
            dispatch(setProjectId(projectId));
        }
    });
    return connect(null, mapDispatchToProps)(ProjectIdUpdatorComponent);
};

export {
    ProjectIdUpdatorHOC as default
};
