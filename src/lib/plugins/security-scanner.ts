// Plugin Security Scanner
// src/lib/plugins/security-scanner.ts

import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { PluginManifest, PluginValidationResult } from '@/types/plugin'
import { getErrorMessage } from '@/lib/utils'

interface SecurityScanResult {
  isSecure: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  score: number // 0-100
  issues: SecurityIssue[]
  recommendations: string[]
  scanTime: Date
  scannedFiles: number
}

interface SecurityIssue {
  type: SecurityIssueType
  severity: 'low' | 'medium' | 'high' | 'critical'
  file: string
  line?: number
  message: string
  evidence?: string
  cwe?: string // Common Weakness Enumeration ID
  remediation?: string
}

type SecurityIssueType = 
  | 'code_injection'
  | 'path_traversal'
  | 'xss_vulnerability'
  | 'sql_injection'
  | 'command_injection'
  | 'file_inclusion'
  | 'unsafe_eval'
  | 'hardcoded_secrets'
  | 'insecure_random'
  | 'weak_crypto'
  | 'unsafe_redirect'
  | 'prototype_pollution'
  | 'regex_dos'
  | 'malicious_code'
  | 'suspicious_network'
  | 'unsafe_file_ops'
  | 'permission_escalation'

interface ScanOptions {
  includeTests?: boolean
  maxFileSize?: number
  deepScan?: boolean
  checkDependencies?: boolean
  timeout?: number
}

export class PluginSecurityScanner {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly SCAN_TIMEOUT = 60000 // 60 seconds
  
  // Security patterns to detect
  private readonly securityPatterns = {
    // Code injection patterns
    code_injection: [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(\s*['"`][^'"`]*['"`]/gi,
      /setInterval\s*\(\s*['"`][^'"`]*['"`]/gi,
      /new\s+Function\s*\(/gi,
      /document\.write\s*\(/gi,
      /innerHTML\s*=/gi,
      /outerHTML\s*=/gi
    ],
    
    // Path traversal patterns
    path_traversal: [
      /\.\.\//g,
      /\.\.\\\\]/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      /path\.join\([^)]*\.\./gi,
      /fs\.[a-zA-Z]*\([^)]*\.\./gi
    ],
    
    // XSS patterns
    xss_vulnerability: [
      /dangerouslySetInnerHTML/gi,
      /v-html/gi,
      /__html/gi,
      /document\.createElement\s*\(\s*['"`]script['"`]/gi,
      /\.appendChild\s*\([^)]*script/gi
    ],
    
    // SQL injection patterns (even though we use MongoDB)
    sql_injection: [
      /['"]\s*\+\s*.*\s*\+\s*['"]/gi,
      /query\s*\+/gi,
      /execute\s*\(/gi,
      /\$where/gi, // MongoDB specific
      /eval\s*:/gi // MongoDB specific
    ],
    
    // Command injection
    command_injection: [
      /exec\s*\(/gi,
      /spawn\s*\(/gi,
      /execSync\s*\(/gi,
      /spawnSync\s*\(/gi,
      /child_process/gi,
      /shell\s*:/gi
    ],
    
    // File inclusion
    file_inclusion: [
      /require\s*\([^)]*user/gi,
      /import\s*\([^)]*user/gi,
      /readFile\s*\([^)]*user/gi,
      /createReadStream\s*\([^)]*user/gi
    ],
    
    // Hardcoded secrets
    hardcoded_secrets: [
      /password\s*[:=]\s*['"`][^'"`]{4,}/gi,
      /secret\s*[:=]\s*['"`][^'"`]{8,}/gi,
      /api[_-]?key\s*[:=]\s*['"`][^'"`]{8,}/gi,
      /token\s*[:=]\s*['"`][^'"`]{16,}/gi,
      /private[_-]?key\s*[:=]/gi,
      /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi
    ],
    
    // Weak cryptography
    weak_crypto: [
      /MD5/gi,
      /SHA1/gi,
      /DES/gi,
      /RC4/gi,
      /Math\.random\(\)/gi,
      /crypto\.pseudoRandomBytes/gi
    ],
    
    // Network requests to suspicious domains
    suspicious_network: [
      /https?:\/\/[^\/]*\.onion/gi,
      /https?:\/\/[^\/]*\.bit/gi,
      /ftp:\/\//gi,
      /telnet:\/\//gi,
      /ssh:\/\//gi
    ],
    
    // Prototype pollution
    prototype_pollution: [
      /__proto__/gi,
      /constructor\.prototype/gi,
      /prototype\.constructor/gi,
      /Object\.setPrototypeOf/gi
    ],
    
    // Unsafe file operations
    unsafe_file_ops: [
      /fs\.unlink\s*\(/gi,
      /fs\.rmdir\s*\(/gi,
      /fs\.rm\s*\(/gi,
      /rimraf/gi,
      /fs\.writeFile\s*\(\s*['"`]\/[^'"`]*['"`]/gi
    ]
  }

  // Malicious code signatures
  private readonly maliciousSignatures = [
    'ZXZhbCg=', // base64 encoded 'eval('
    'RnVuY3Rpb24o', // base64 encoded 'Function('
    'Y29uc29sZS5sb2c=', // base64 encoded 'console.log'
    'cHJvY2Vzcy5lbnY=', // base64 encoded 'process.env'
  ]

  /**
   * Scan a plugin directory for security issues
   */
  async scanPlugin(pluginPath: string, options: ScanOptions = {}): Promise<SecurityScanResult> {
    const startTime = Date.now()
    const scanOptions = {
      includeTests: false,
      maxFileSize: this.MAX_FILE_SIZE,
      deepScan: true,
      checkDependencies: true,
      timeout: this.SCAN_TIMEOUT,
      ...options
    }

    console.log(`🔍 Starting security scan for plugin at: ${pluginPath}`)

    try {
      const issues: SecurityIssue[] = []
      let scannedFiles = 0

      // Set scan timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Security scan timeout')), scanOptions.timeout!)
      })

      const scanPromise = this.performSecurityScan(pluginPath, scanOptions, issues)
      
      // Race between scan and timeout
      await Promise.race([scanPromise, timeoutPromise])
      
      scannedFiles = await this.countScannedFiles(pluginPath, scanOptions)

      // Calculate security score and risk level
      const { score, riskLevel } = this.calculateSecurityScore(issues)

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues)

      const scanTime = Date.now() - startTime
      console.log(`✅ Security scan completed in ${scanTime}ms`)

      return {
        isSecure: riskLevel !== 'critical' && riskLevel !== 'high',
        riskLevel,
        score,
        issues,
        recommendations,
        scanTime: new Date(),
        scannedFiles
      }

    } catch (error) {
      console.error('❌ Security scan failed:', error)
      
      return {
        isSecure: false,
        riskLevel: 'critical',
        score: 0,
        issues: [{
          type: 'malicious_code',
          severity: 'critical',
          file: 'scan-error',
          message: `Security scan failed: ${getErrorMessage(error)}`,
          remediation: 'Manual security review required'
        }],
        recommendations: ['Manual security review required due to scan failure'],
        scanTime: new Date(),
        scannedFiles: 0
      }
    }
  }

  /**
   * Quick security check for plugin manifest
   */
  async quickSecurityCheck(manifest: PluginManifest): Promise<{
    isSecure: boolean
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    issues: string[]
  }> {
    const issues: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Check permissions
    const permissions = manifest.permissions || []
    const highRiskPermissions = [
      'database:write', 'files:write', 'settings:write', 
      'plugins:manage', 'themes:manage', 'cron:schedule'
    ]
    
    const hasHighRiskPerms = permissions.some(p => highRiskPermissions.includes(p))
    if (hasHighRiskPerms) {
      issues.push('Plugin requests high-risk permissions')
      riskLevel = 'high'
    }

    // Check for excessive permissions
    if (permissions.length > 8) {
      issues.push('Plugin requests excessive permissions')
      if (riskLevel === 'low') riskLevel = 'medium'
    }

    // Check for suspicious routes
    if (manifest.routes) {
      for (const route of manifest.routes) {
        if (route.path.includes('..') || route.path.includes('%')) {
          issues.push(`Suspicious route path: ${route.path}`)
          riskLevel = 'high'
        }
      }
    }

    // Check for external dependencies
    if (manifest.dependencies?.packages) {
      const packageCount = Object.keys(manifest.dependencies.packages).length
      if (packageCount > 10) {
        issues.push('Plugin has many external dependencies')
        if (riskLevel === 'low') riskLevel = 'medium'
      }
    }

    // Check security settings
    if (manifest.security?.sandbox === false) {
      issues.push('Plugin disables sandboxing')
      riskLevel = 'high'
    }

    return {
      isSecure: riskLevel !== 'high',
      riskLevel,
      issues
    }
  }

  /**
   * Scan plugin dependencies for known vulnerabilities
   */
  async scanDependencies(pluginPath: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = []

    try {
      const packageJsonPath = path.join(pluginPath, 'package.json')
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

        // In a real implementation, this would check against a vulnerability database
        // For now, we'll check for some known problematic packages
        const problematicPackages = [
          'lodash', // versions < 4.17.21 have prototype pollution
          'marked', // versions < 4.0.10 have XSS vulnerabilities
          'axios', // versions < 0.21.1 have SSRF vulnerabilities
          'jsonwebtoken', // versions < 8.5.1 have algorithm confusion
        ]

        for (const [packageName, version] of Object.entries(dependencies)) {
          if (problematicPackages.includes(packageName)) {
            issues.push({
              type: 'malicious_code',
              severity: 'medium',
              file: 'package.json',
              message: `Potentially vulnerable dependency: ${packageName}@${version}`,
              remediation: `Update ${packageName} to latest version`
            })
          }
        }
      } catch {
        // No package.json or invalid format
      }
    } catch (error) {
      console.warn('Failed to scan dependencies:', error)
    }

    return issues
  }

  // Private methods

  private async performSecurityScan(
    pluginPath: string, 
    options: ScanOptions, 
    issues: SecurityIssue[]
  ): Promise<void> {
    await this.scanDirectory(pluginPath, pluginPath, options, issues)
    
    if (options.checkDependencies) {
      const depIssues = await this.scanDependencies(pluginPath)
      issues.push(...depIssues)
    }
  }

  private async scanDirectory(
    dirPath: string, 
    basePath: string, 
    options: ScanOptions, 
    issues: SecurityIssue[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name)
        const relativePath = path.relative(basePath, entryPath)

        // Skip certain directories
        if (this.shouldSkipPath(entry.name, options)) continue

        if (entry.isDirectory()) {
          await this.scanDirectory(entryPath, basePath, options, issues)
        } else if (entry.isFile()) {
          await this.scanFile(entryPath, relativePath, options, issues)
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error)
    }
  }

  private async scanFile(
    filePath: string, 
    relativePath: string, 
    options: ScanOptions, 
    issues: SecurityIssue[]
  ): Promise<void> {
    try {
      // Check file size
      const stat = await fs.stat(filePath)
      if (stat.size > options.maxFileSize!) {
        issues.push({
          type: 'suspicious_network',
          severity: 'medium',
          file: relativePath,
          message: 'File exceeds maximum size limit',
          remediation: 'Review large files for malicious content'
        })
        return
      }

      // Only scan text files
      if (!this.isTextFile(filePath)) return

      const content = await fs.readFile(filePath, 'utf-8')
      
      // Scan for security patterns
      await this.scanFileContent(content, relativePath, issues)
      
      // Check for malicious signatures
      await this.scanForMaliciousSignatures(content, relativePath, issues)
      
      // Scan for obfuscated code
      await this.scanForObfuscation(content, relativePath, issues)

    } catch (error) {
      // Skip files that can't be read
    }
  }

  private async scanFileContent(content: string, filePath: string, issues: SecurityIssue[]): Promise<void> {
    const lines = content.split('\n')

    for (const [issueType, patterns] of Object.entries(this.securityPatterns)) {
      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length
          
          issues.push({
            type: issueType as SecurityIssueType,
            severity: this.getSeverityForIssueType(issueType as SecurityIssueType),
            file: filePath,
            line: lineNumber,
            message: this.getMessageForIssueType(issueType as SecurityIssueType),
            evidence: match[0],
            remediation: this.getRemediationForIssueType(issueType as SecurityIssueType)
          })
        }
      }
    }
  }

  private async scanForMaliciousSignatures(content: string, filePath: string, issues: SecurityIssue[]): Promise<void> {
    for (const signature of this.maliciousSignatures) {
      if (content.includes(signature)) {
        issues.push({
          type: 'malicious_code',
          severity: 'critical',
          file: filePath,
          message: 'Potential malicious code signature detected',
          evidence: signature,
          remediation: 'Remove or review suspicious code'
        })
      }
    }
  }

  private async scanForObfuscation(content: string, filePath: string, issues: SecurityIssue[]): Promise<void> {
    // Check for common obfuscation patterns
    const obfuscationPatterns = [
      /\\x[0-9a-f]{2}/gi, // Hex encoded strings
      /\\u[0-9a-f]{4}/gi, // Unicode escaped strings
      /String\.fromCharCode/gi, // Character code conversion
      /[a-zA-Z0-9+/]{50,}={0,2}/g, // Base64 strings
      /eval\s*\(\s*atob\s*\(/gi, // Base64 eval
    ]

    for (const pattern of obfuscationPatterns) {
      if (pattern.test(content)) {
        const matches = content.match(pattern) || []
        if (matches.length > 5) { // Only flag if many matches
          issues.push({
            type: 'malicious_code',
            severity: 'medium',
            file: filePath,
            message: 'Potentially obfuscated code detected',
            remediation: 'Review obfuscated code for malicious intent'
          })
          break
        }
      }
    }
  }

  private shouldSkipPath(name: string, options: ScanOptions): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.DS_Store',
      'Thumbs.db'
    ]

    if (!options.includeTests) {
      skipPatterns.push('test', 'tests', '__tests__', '*.test.*', '*.spec.*')
    }

    return skipPatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'))
        return regex.test(name)
      }
      return name === pattern
    })
  }

  private isTextFile(filePath: string): boolean {
    const textExtensions = ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.txt', '.csv', '.sql', '.css', '.html', '.xml']
    return textExtensions.some(ext => filePath.toLowerCase().endsWith(ext))
  }

  private async countScannedFiles(pluginPath: string, options: ScanOptions): Promise<number> {
    let count = 0
    
    const countFiles = async (dir: string) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          if (this.shouldSkipPath(entry.name, options)) continue
          
          const entryPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            await countFiles(entryPath)
          } else if (entry.isFile() && this.isTextFile(entryPath)) {
            count++
          }
        }
      } catch {
        // Ignore errors
      }
    }
    
    await countFiles(pluginPath)
    return count
  }

  private calculateSecurityScore(issues: SecurityIssue[]): { score: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' } {
    let score = 100
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    const severityWeights = {
      low: 2,
      medium: 5,
      high: 15,
      critical: 30
    }

    for (const issue of issues) {
      score -= severityWeights[issue.severity]
      
      if (issue.severity === 'critical') riskLevel = 'critical'
      else if (issue.severity === 'high' && riskLevel !== 'critical') riskLevel = 'high'
      else if (issue.severity === 'medium' && riskLevel === 'low') riskLevel = 'medium'
    }

    score = Math.max(0, score)

    // Adjust risk level based on score
    if (score < 30) riskLevel = 'critical'
    else if (score < 50) riskLevel = 'high'
    else if (score < 70) riskLevel = 'medium'

    return { score, riskLevel }
  }

  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations = new Set<string>()

    for (const issue of issues) {
      if (issue.remediation) {
        recommendations.add(issue.remediation)
      }
    }

    // Add general recommendations
    if (issues.length > 0) {
      recommendations.add('Perform thorough code review')
      recommendations.add('Consider using static analysis tools')
      recommendations.add('Implement input validation and sanitization')
    }

    if (issues.some(i => i.severity === 'critical')) {
      recommendations.add('Do not install this plugin in production')
      recommendations.add('Contact plugin author about security issues')
    }

    return Array.from(recommendations)
  }

  private getSeverityForIssueType(type: SecurityIssueType): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<SecurityIssueType, 'low' | 'medium' | 'high' | 'critical'> = {
      code_injection: 'critical',
      command_injection: 'critical',
      malicious_code: 'critical',
      path_traversal: 'high',
      xss_vulnerability: 'high',
      sql_injection: 'high',
      unsafe_eval: 'high',
      file_inclusion: 'high',
      permission_escalation: 'high',
      hardcoded_secrets: 'medium',
      weak_crypto: 'medium',
      unsafe_redirect: 'medium',
      prototype_pollution: 'medium',
      unsafe_file_ops: 'medium',
      regex_dos: 'medium',
      suspicious_network: 'medium',
      insecure_random: 'low'
    }

    return severityMap[type] || 'medium'
  }

  private getMessageForIssueType(type: SecurityIssueType): string {
    const messageMap: Record<SecurityIssueType, string> = {
      code_injection: 'Potential code injection vulnerability',
      command_injection: 'Potential command injection vulnerability',
      malicious_code: 'Suspicious or malicious code pattern',
      path_traversal: 'Potential path traversal vulnerability',
      xss_vulnerability: 'Potential XSS vulnerability',
      sql_injection: 'Potential SQL injection vulnerability',
      unsafe_eval: 'Unsafe use of eval() function',
      file_inclusion: 'Potential file inclusion vulnerability',
      permission_escalation: 'Potential privilege escalation',
      hardcoded_secrets: 'Hardcoded credentials or secrets',
      weak_crypto: 'Use of weak cryptographic algorithm',
      unsafe_redirect: 'Potentially unsafe redirect',
      prototype_pollution: 'Potential prototype pollution',
      unsafe_file_ops: 'Unsafe file system operations',
      regex_dos: 'Potential ReDoS vulnerability',
      suspicious_network: 'Suspicious network activity',
      insecure_random: 'Use of insecure random number generation'
    }

    return messageMap[type] || 'Security issue detected'
  }

  private getRemediationForIssueType(type: SecurityIssueType): string {
    const remediationMap: Record<SecurityIssueType, string> = {
      code_injection: 'Avoid dynamic code execution, use safe alternatives',
      command_injection: 'Validate and sanitize command inputs',
      malicious_code: 'Remove or review suspicious code',
      path_traversal: 'Validate and sanitize file paths',
      xss_vulnerability: 'Sanitize user inputs and use safe DOM manipulation',
      sql_injection: 'Use parameterized queries or prepared statements',
      unsafe_eval: 'Replace eval() with safer alternatives like JSON.parse()',
      file_inclusion: 'Validate file paths and use allow-lists',
      permission_escalation: 'Review and restrict privilege requirements',
      hardcoded_secrets: 'Move secrets to environment variables',
      weak_crypto: 'Use strong cryptographic algorithms (SHA-256, AES)',
      unsafe_redirect: 'Validate redirect URLs against allow-list',
      prototype_pollution: 'Validate object properties and use Object.create(null)',
      unsafe_file_ops: 'Validate file paths and implement proper access controls',
      regex_dos: 'Optimize regular expressions to prevent catastrophic backtracking',
      suspicious_network: 'Review network requests for legitimacy',
      insecure_random: 'Use cryptographically secure random generators'
    }

    return remediationMap[type] || 'Review and fix security issue'
  }
}

// Export singleton instance
export const pluginSecurityScanner = new PluginSecurityScanner()

// Export class for testing
export default PluginSecurityScanner