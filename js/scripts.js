const PATTERNS = {
    title: [
        '#R 23 23',
        'x = 73, y = 21, rule = B3/S23',
        '13b4o37bo$12bo3bo37bo$12bo6b3o2b5o3b3ob3ob4o2b3ob3obo2b4o$12bo5bo3bo',
        '2bo3bo3bo3bo2bo3bo2bo3bo4bo3bo$12bo5bo3bo2bo3bo3bobobo6bo2bo3bo4bo$',
        '12bo5bo3bo2bo3bo3bobobo3b4o2bo3bo5b3o$12bo5bo3bo2bo3bo3bobobo2bo3bo2b',
        'o3bo8bo$12bo3bobo3bo2bo3bo3bobobo2bo3bo2bo3bo4bo3bo$13b4o2b3o2b3ob3o',
        '3bobo4b4o3b4o4b4o$51bo$47b4o$$b4o35b2o7b3o6bo5b2o$o3bo34bo2bo7bo12bo',
        '2bo$o5b4o2b5o4b3o9b3o3bo10bo5b3o4bo5b3o$o5bo3bo2bobobo2bo3bo7bo3bob4o',
        '8bo7bo3b4o2bo3bo$o9bo2bobobo2bo3bo7bo3bo2bo10bo7bo4bo4bo3bo$ob3o2b4o',
        '2bobobo2b5o7bo3bo2bo10bo7bo4bo4b5o$o3bobo3bo2bobobo2bo11bo3bo2bo10bo',
        '7bo4bo4bo$o3bobo3bo2bobobo2bo11bo3bo2bo10bo3bo3bo4bo4bo$b4o2b4ob2obob',
        '2o2b4o8b3o2b3o8b6ob5ob3o4b4o!'
    ].join('\n'),
    glider: [
        '#R 58 32',
        'x = 3, y = 3, rule = B3/S23',
        'bo$2bo$3o!'
    ].join('\n'),
    canadaGoose: [
        '#R 53 28',
        'x = 13, y = 12, rule = B3/S23',
        '3o$o9b2o$bo6b3obo$3b2o2b2o$4bo$8bo$4b2o3bo$3bobob2o$3bobo2bob2o$2bo4b',
        '2o$2b2o$2b2o!'
    ].join('\n'),
    rPentomino: [
        '#R 58 32',
        'x = 3, y = 3, rule = B3/S23',
        'b2o$2o$bo!'
    ].join('\n'),
    line: [
        '#R 0 33',
        'x = 120, y = 0, rule = B3/S23',
        '120o!'
    ].join('\n'),
}


//==============================================================================
// Utility Functions
//==============================================================================

function addEvent(el, type, handler) {
    if (el.attachEvent) {
        el.attachEvent('on' + type, handler);
    }
    else {
        el.addEventListener(type, handler);
    }
}


//==============================================================================
// Example Pattern Handler
//==============================================================================

function handlerExamples(lifeCanvas, examplesEl) {
    return function() {
        let selected = examplesEl.options[examplesEl.selectedIndex].value;
        if (selected != 'none') {
            lifeCanvas.setControlValue('rleInput', PATTERNS[selected]);
        }
        else {
            lifeCanvas.setControlValue('rleInput', '');
        }
    }
}


//==============================================================================
// Main
//==============================================================================

function main() {
    const selectExamples = document.getElementById('select-examples');

    const life = new CanvasLife(
        {
            scale: 3
        }
    );
    
    life.readRLEString(PATTERNS['canadaGoose'], true);

    addEvent(
        selectExamples,
        'change',
        handlerExamples(life, selectExamples)
    );
}


addEvent(
    window,
    'load',
    main
);
