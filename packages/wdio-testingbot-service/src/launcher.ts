import { performance, PerformanceObserver } from 'node:perf_hooks'
import { promisify } from 'node:util'

import testingbotTunnel from 'testingbot-tunnel-launcher'
import logger from '@wdio/logger'
import type { Capabilities, Options, Services } from '@wdio/types'

import type { TestingbotOptions, TestingbotTunnel, TunnelLauncherOptions } from './types.js'

const log = logger('@wdio/testingbot-service')

export default class TestingBotLauncher implements Services.ServiceInstance {
    options: TestingbotOptions
    tbTunnelOpts!: TunnelLauncherOptions
    tunnel?: TestingbotTunnel
    constructor (options: TestingbotOptions) {
        this.options = options
    }

    async onPrepare (config: Options.Testrunner, capabilities: Capabilities.TestrunnerCapabilities) {
        if (!this.options.tbTunnel || !config.user || !config.key) {
            return
        }

        const tbTunnelIdentifier = (
            this.options.tbTunnelOpts?.tunnelIdentifier ||
            `TB-tunnel-${Math.random().toString().slice(2)}`
        )

        this.tbTunnelOpts = Object.assign({
            apiKey: config.user,
            apiSecret: config.key,
            'tunnel-identifier': tbTunnelIdentifier,
        }, this.options.tbTunnelOpts)

        const capabilitiesEntries = Array.isArray(capabilities) ?
            (capabilities as []).every(cap => Object.values(cap).length > 0 && Object.values(cap).every(c => typeof c === 'object' && (c as Capabilities.RequestedMultiremoteCapabilities).capabilities)) ?
                capabilities.flatMap((cap: Capabilities.RequestedMultiremoteCapabilities ) => Object.values(cap))
                : capabilities
            : Object.values(capabilities)
        for (const capability of capabilitiesEntries) {
            const caps = (capability as Capabilities.WithRequestedCapabilities).capabilities || capability
            const c = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps

            if (!c['tb:options']) {
                c['tb:options'] = {}
            }

            c['tb:options']['tunnel-identifier'] = tbTunnelIdentifier
        }

        /**
         * measure TestingBot tunnel boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`TestingBot tunnel successfully started after ${entry.duration}ms`)
        })
        obs.observe({ entryTypes: ['measure'] })

        performance.mark('tbTunnelStart')
        this.tunnel = await promisify(testingbotTunnel)(this.tbTunnelOpts)
        performance.mark('tbTunnelEnd')
        performance.measure('bootTime', 'tbTunnelStart', 'tbTunnelEnd')
    }

    /**
     * Shut down the tunnel
     * @returns {Promise} Resolved promise when tunnel is closed
     */
    onComplete () {
        if (!this.tunnel) {
            return
        }

        return new Promise(resolve => this.tunnel!.close(resolve))
    }
}
