class MinHeap {
    constructor(compareFn) {
        this.heap = [];
        this.compare = compareFn;
    }

    size() {
        return this.heap.length;
    }

    peek() {
        return this.heap[0];
    }

    push(item) {
        this.heap.push(item);
        this._bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    _bubbleUp(idx) {
        while (idx > 0) {
            const parent = Math.floor((idx - 1) / 2);
            if (this.compare(this.heap[idx], this.heap[parent]) < 0) {
                [this.heap[idx], this.heap[parent]] = [
                    this.heap[parent],
                    this.heap[idx],
                ];
                idx = parent;
            } else {
                break;
            }
        }
    }

    _sinkDown(idx) {
        const n = this.heap.length;
        while (true) {
            const left = 2 * idx + 1;
            const right = 2 * idx + 2;
            let smallest = idx;
            if (
                left < n &&
                this.compare(this.heap[left], this.heap[smallest]) < 0
            )
                smallest = left;
            if (
                right < n &&
                this.compare(this.heap[right], this.heap[smallest]) < 0
            )
                smallest = right;
            if (smallest === idx) break;
            [this.heap[idx], this.heap[smallest]] = [
                this.heap[smallest],
                this.heap[idx],
            ];
            idx = smallest;
        }
    }
}

module.exports = MinHeap;
