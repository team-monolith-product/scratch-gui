const INTEGRATION_TEST_QUERY = 'integration_test=true';
const INTEGRATION_TEST_QUERY_PATTERN = /[?&]integration_test=true(?:[&#]|$)/;
const FILE_URI_PATTERN = /^file:/;

const hasIntegrationTestQuery = uri => INTEGRATION_TEST_QUERY_PATTERN.test(uri);

const isIntegrationTestMode = uri => FILE_URI_PATTERN.test(uri) && hasIntegrationTestQuery(uri);

const addIntegrationTestMode = uri => {
    if (hasIntegrationTestQuery(uri)) return uri;

    const hashIndex = uri.indexOf('#');
    const uriWithoutHash = hashIndex === -1 ? uri : uri.substring(0, hashIndex);
    const hash = hashIndex === -1 ? '' : uri.substring(hashIndex);
    const querySeparator = uriWithoutHash.includes('?') ? '&' : '?';

    return `${uriWithoutHash}${querySeparator}${INTEGRATION_TEST_QUERY}${hash}`;
};

export {
    addIntegrationTestMode,
    isIntegrationTestMode
};
