const createChromeOptions = (args, binary) => {
    const options = {args};
    if (binary) {
        options.binary = binary;
    }
    return options;
};

export default createChromeOptions;
