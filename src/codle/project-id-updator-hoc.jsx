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
            const {
                forwardedRef,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    {...componentProps}
                    ref={forwardedRef}
                />
            );
        }
    }
    ProjectIdUpdatorComponent.propTypes = {
        forwardedRef: PropTypes.oneOfType([
            PropTypes.func,
            PropTypes.object
        ]),
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func
    };
    const mapDispatchToProps = dispatch => ({
        setProjectId: projectId => {
            dispatch(setProjectId(projectId));
        }
    });
    const ConnectedProjectIdUpdator = connect(null, mapDispatchToProps)(ProjectIdUpdatorComponent);
    const ProjectIdUpdatorWithRef = React.forwardRef((props, ref) => (
        <ConnectedProjectIdUpdator
            {...props}
            forwardedRef={ref}
        />
    ));
    ProjectIdUpdatorWithRef.displayName = 'ProjectIdUpdatorWithRef';
    return ProjectIdUpdatorWithRef;
};

export {
    ProjectIdUpdatorHOC as default
};
