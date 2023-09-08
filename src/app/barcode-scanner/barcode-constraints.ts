export class Constraints {
    static Portrait: MediaStreamConstraints = {
        audio: false,
        video: {
            frameRate: {
                ideal: 60
            },
            aspectRatio: 16/9,
            facingMode: 'environment',
        },
    }
    static Landscape: MediaStreamConstraints = {
        audio: false,
        video: {
            frameRate: {
                ideal: 60
            },
            aspectRatio: 9/16,
            facingMode: 'environment',
        },
    }
}