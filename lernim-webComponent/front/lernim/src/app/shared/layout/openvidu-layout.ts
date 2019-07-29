declare var $: any;

export interface OpenViduLayoutOptions {
  elementClass: string; // The class attached to the video elements.
  fillColumnsFirst: boolean; // Tries to fill the columns first and then the rows.
  animate: boolean; // Whether you want to animate the transitions.
}

interface CustomVideoElement {
  el: HTMLElement;
  video: HTMLVideoElement;
  ratio: number;
}

export class OpenViduLayout {
  private layoutContainer: HTMLElement;
  private options: OpenViduLayoutOptions = {
    elementClass: 'OT_video_element',
    fillColumnsFirst: false,
    animate: false
  };

  /**
   * Initializes the layout with a container and a group of options.
   */
  initLayoutContainer(container: HTMLElement, options: any): void {
    this.layoutContainer = container;
    this.setLayoutOptions(options);
  }

  /**
   * Sets the layout options filling the undefined values with the previous ones.
   */
  setLayoutOptions(options: any): void {
    this.options.elementClass = options.elementClass || this.options.elementClass;
    this.options.fillColumnsFirst = options.fillColumnsFirst || this.options.fillColumnsFirst;
    this.options.animate = options.animate || this.options.animate;
  }

  /**
   * Updates the layout.
   */
  updateLayout(): void {
    // Gets or sets an id for the container.
    let id = this.layoutContainer.id;
    if (!id) {
      id = 'OT_' + this.cheapUUID();
      this.layoutContainer.id = id;
    }

    const HEIGHT = this.getCSSNumber(this.layoutContainer, 'height') - this.getCSSNumber(this.layoutContainer, 'borderTop') -
      this.getCSSNumber(this.layoutContainer, 'borderBottom');
    const WIDTH = this.getCSSNumber(this.layoutContainer, 'width') - this.getCSSNumber(this.layoutContainer, 'borderLeft') -
      this.getCSSNumber(this.layoutContainer, 'borderRight');

    const elements = this.layoutContainer.querySelectorAll('#' + id + '>.' + this.options.elementClass);
    let elementArray: HTMLElement[] = Array.prototype.map.call(elements, (el) => el);
    elementArray = elementArray.filter((el) => el.style.display !== 'none');

    // Get the list of videos.
    const videoElements = elementArray.map((el) => {
      const video = <HTMLVideoElement>el.querySelector('video');
      return {
        el,
        video,
        ratio: this.getVideoRatio(video)
      };
    });


    this.arrange(videoElements, WIDTH, HEIGHT);
  }


  // AUXILIARY METHODS --------------------------------------------------------

  /**
   * Gets the ratio of the specified video.
   */
  private getVideoRatio(video: HTMLVideoElement) {
    if (video && video.readyState >= 1) { // 1: HAVE_METADATA
      console.log('JULS video', video.readyState, video.videoWidth, video.videoHeight);
      return video.videoHeight / video.videoWidth;
    }

    return 3 / 4;
  }

  /**
   * Converts a CSS property to a number.
   */
  private getCSSNumber(elem: HTMLElement, prop: string): number {
    const cssStr = $(elem).css(prop);
    return cssStr ? parseInt(cssStr, 10) : 0;
  }

  /**
   * Creates a really cheap UUID.
   */
  private cheapUUID(): string {
    return (Math.random() * 100000000).toFixed(0);
  }

  /**
   * Gets the best dimension for the specified configuration.
   */
  private getBestDimensions(children: CustomVideoElement[], WIDTH: number, HEIGHT: number) {
    const bestDimensions = {
      maxArea: 0,
      numColumns: 0,
      numRows: 0,
      maxCellHeight: 0,
      maxCellWidth: 0,
      cellRatio: 0
    };

    // Iterate through every possible combination of rows and columns
    // and see which one has the least amount of whitespace
    for (let i = 1; i <= children.length; i++) {
      const numColumns = i;
      const numRows = Math.ceil(children.length / numColumns);

      // Calculates the whole area used by the videos.
      const maxCellHeight = Math.floor(HEIGHT / numRows);
      const maxCellWidth = Math.floor(WIDTH / numColumns);
      const cellRatio = maxCellHeight / maxCellWidth;
      let totalArea = 0;

      for (const child of children) {
        let usedHeight = maxCellHeight;
        let usedWidth = maxCellWidth;

        if (cellRatio > child.ratio) {
          // Decrease the height to fit in the cell.
          usedHeight = maxCellWidth * child.ratio;
        } else if (cellRatio < child.ratio) {
          // Decrease the width to fit in the cell.
          usedWidth = maxCellHeight / child.ratio;
        }

        totalArea += usedHeight * usedWidth;
      }

      // If this width and height takes up the most space then we're going with that
      if (bestDimensions.maxArea < totalArea) {
        bestDimensions.maxArea = totalArea;
        bestDimensions.maxCellHeight = maxCellHeight;
        bestDimensions.maxCellWidth = maxCellWidth;
        bestDimensions.numColumns = numColumns;
        bestDimensions.numRows = numRows;
        bestDimensions.cellRatio = cellRatio;
      }
    }

    return bestDimensions;
  }

  /**
   * Arranges all the elements inside the container.
   */
  private arrange(children: CustomVideoElement[], WIDTH: number, HEIGHT: number): void {
    const dimensions = this.getBestDimensions(children, WIDTH, HEIGHT);

    // Change children
    for (const child of children) {
      console.log('JULS video end', child, dimensions);
      let w = dimensions.maxCellWidth;
      let h = dimensions.maxCellHeight;

      if (dimensions.cellRatio > child.ratio) {
        // Decrease the height to fit in the cell.
        h = dimensions.maxCellWidth * child.ratio;
      } else if (dimensions.cellRatio < child.ratio) {
        // Decrease the width to fit in the cell.
        w = dimensions.maxCellHeight / child.ratio;
      }

      $(child.el).css({
        width: w + 'px',
        height: h + 'px'
      });
    }

    // Change container
    $(this.layoutContainer).css({
      display: 'flex',
      'flex-direction': this.options.fillColumnsFirst ? 'column' : 'row',
      'flex-wrap': 'wrap',
      'justify-content': 'center',
      'align-content': 'center',
      'align-items': 'center'
    });
  }
}
