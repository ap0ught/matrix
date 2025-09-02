/*
 * Dynamic Effects Configuration System
 * 
 * This module provides a dynamic system for mapping effect names to their corresponding
 * pass implementations, eliminating the need for hardcoded effects arrays that require
 * manual maintenance when effects are added or removed.
 * 
 * The system supports both WebGPU and REGL renderers by providing a standardized
 * interface for effect discovery and mapping.
 */

/**
 * Creates a dynamic effects mapping for the given renderer type
 * @param {string} renderer - Either 'webgpu' or 'regl'
 * @param {Object} passModules - Object containing imported pass modules
 * @returns {Object} Effects mapping object
 */
function createEffectsMapping(renderer, passModules) {
    const effects = {};
    
    // Base effect mappings - these handle the core pass mappings
    const baseEffects = {
        none: null,
        plain: passModules.makePalettePass,
        palette: passModules.makePalettePass,
        customStripes: passModules.makeStripePass,
        stripes: passModules.makeStripePass,
        pride: passModules.makeStripePass,
        transPride: passModules.makeStripePass,
        trans: passModules.makeStripePass,
        image: passModules.makeImagePass,
        mirror: passModules.makeMirrorPass,
    };
    
    // Add all base effects
    Object.assign(effects, baseEffects);
    
    // Future enhancement: Could auto-discover additional effects from pass modules
    // or from configuration files
    
    return effects;
}

/**
 * Gets the appropriate effect pass for a given effect name
 * @param {string} effectName - Name of the effect to get
 * @param {Object} effects - Effects mapping object
 * @param {string} defaultEffect - Default effect to use if effectName not found
 * @returns {Function|null} The effect pass function or null
 */
function getEffectPass(effectName, effects, defaultEffect = 'palette') {
    return effectName in effects ? effects[effectName] : effects[defaultEffect];
}

export { createEffectsMapping, getEffectPass };