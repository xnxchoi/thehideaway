self.addEventListener("message", async (event) => {
    const {data, pixels, uid} = event.data;

    const getPixelBrightness = (data, i) => {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        /*
        Color brightness is determined by the following formula:
        ((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000
        Source: https://www.w3.org/TR/AERT/#color-contrast
        */

        return 0.299 * r + 0.587 * g + 0.114 * b;
    };

    let totalBrightness = 0;

    // max number of data access attempts.
    const maxTrials = 100;
    const numTrials = Math.min(pixels, maxTrials);

    for (let t = 0; t < numTrials; t++) {
        let x = Math.random();
        let i = Math.trunc((x * data.length) / 4) * 4;

        totalBrightness += getPixelBrightness(data, i);
    }

    const mean = totalBrightness / numTrials;

    /*
     For With images with a lot of variance in brightness you can do an extra calc for this variance
     https://www.scribbr.com/statistics/variance/
     */

    self.postMessage({mean, uid});
});
 