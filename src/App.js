import React, { useState, useEffect, useCallback } from 'react';

// Mocked data for single-file structure
const initialOntologiesDb = {
    adp: { name: 'Agent Discovery Protocol', prefix: 'adp', uri: 'https://webcivics.github.io/adp/ontdev/adp#', terms: ['Agent', 'agentType', 'hasWebID', 'hasLinkedinAccount', 'hasTwitterAccount', 'hasEcashAccount', 'hasPodStorage', 'serviceEndpoint', 'sparqlEndpoint', 'trusts', 'AIAgent', 'ContentProvider', 'FinancialInstitution', 'EssentialService'], },
    schema: { name: 'Schema.org', prefix: 'schema', uri: 'https://schema.org/', terms: ['Person', 'Organization', 'SoftwareApplication', 'WebSite', 'name', 'description', 'url', 'domain', 'provider', 'isAdultOriented'], },
    foaf: { name: 'Friend of a Friend', prefix: 'foaf', uri: 'http://xmlns.com/foaf/0.1/', terms: ['Person', 'Organization', 'Agent', 'name', 'givenName', 'familyName', 'mbox', 'homepage', 'maker', 'account'], },
    dcterms: { name: 'Dublin Core Terms', prefix: 'dcterms', uri: 'http://purl.org/dc/terms/', terms: ['title', 'description', 'creator', 'created', 'publisher', 'rights'], },
    vc: { name: 'Verifiable Credentials', prefix: 'vc', uri: 'https://www.w3.org/2018/credentials#', terms: ['VerifiableCredential', 'issuer', 'credentialSubject'], },
    xsd: { name: 'XML Schema', prefix: 'xsd', uri: 'http://www.w3.org/2001/XMLSchema#', terms: ['string', 'integer', 'date'] }
};
const agentTypeTemplates = {
    'naturalPerson': { types: ['adp:Agent', 'schema:Person'], properties: [ { id: 1, prefix: 'foaf', property: 'name', value: 'Alex Doe', type: 'literal' }, { id: 2, prefix: 'schema', property: 'description', value: 'A personal agent profile for Alex Doe.', type: 'literal' }, { id: 3, prefix: 'adp', property: 'hasTwitterAccount', value: 'alexdoe', type: 'literal' }, { id: 4, prefix: 'adp', property: 'hasEcashAccount', value: 'ecash:q...', type: 'literal' }, ] },
    'organization': { types: ['adp:Agent', 'schema:Organization'], properties: [ { id: 1, prefix: 'foaf', property: 'name', value: 'Example Corp', type: 'literal' }, { id: 2, prefix: 'schema', property: 'description', value: 'An example organization providing services.', type: 'literal' }, { id: 3, prefix: 'schema', property: 'url', value: 'https://example.com', type: 'uri' }, ] },
    'aiAgent': { types: ['adp:Agent', 'adp:AIAgent', 'schema:SoftwareApplication'], properties: [ { id: 1, prefix: 'foaf', property: 'name', value: 'AI Assistant', type: 'literal' }, { id: 2, prefix: 'schema', property: 'description', value: 'An AI-powered service.', type: 'literal' }, { id: 3, prefix: 'schema', property: 'provider', value: 'Example Corp', type: 'literal' }, { id: 4, prefix: 'adp', property: 'serviceEndpoint', value: 'https://api.example.com/v1', type: 'uri' }, ] },
    'humanitarian': { types: ['adp:Agent', 'adp:EssentialService'], properties: [ { id: 1, prefix: 'foaf', property: 'name', value: 'Global Aid Org', type: 'literal' }, { id: 2, prefix: 'schema', property: 'description', value: 'A humanitarian organization providing emergency relief.', type: 'literal' }, ] },
    'adultWebsite': { types: ['adp:Agent', 'adp:ContentProvider'], properties: [ { id: 1, prefix: 'foaf', property: 'name', value: 'Adult Content Site', type: 'literal' }, { id: 2, prefix: 'schema', property: 'isAdultOriented', value: 'true', type: 'literal' }, ] }
};
const Input = ({ label, value, onChange, placeholder, listId, readOnly = false }) => ( <div> <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label> <input type="text" value={value} onChange={onChange} placeholder={placeholder} list={listId} readOnly={readOnly} className={`w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${readOnly ? 'cursor-not-allowed' : ''}`} /> </div> );
const Select = ({ label, value, onChange, children }) => ( <div> <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label> <select value={value} onChange={onChange} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"> {children} </select> </div> );
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => { const baseClasses = "px-4 py-2 rounded-md font-semibold text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-150 transform hover:scale-105"; const variants = { primary: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500', secondary: 'bg-gray-600 hover:bg-gray-500 text-gray-200 focus:ring-gray-400', }; return ( <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100`}> {children} </button> ); };

const TabButton = ({ children, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`px-6 py-3 text-lg font-medium rounded-t-lg transition-colors focus:outline-none ${
            isActive
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

function CreatorView() {
    const [domainName, setDomainName] = useState('example.com');
    const [agentType, setAgentType] = useState('naturalPerson');
    const [properties, setProperties] = useState(agentTypeTemplates.naturalPerson.properties);
    const [trusts, setTrusts] = useState([]);
    const [userProvidedCid, setUserProvidedCid] = useState('');
    const [ontologiesDb] = useState(initialOntologiesDb);
    const [selectedOntologies, setSelectedOntologies] = useState(['adp', 'foaf', 'schema', 'dcterms', 'vc', 'xsd']);
    const [rdfOutput, setRdfOutput] = useState('');
    const [dnsRecord, setDnsRecord] = useState({ type: '', name: '', content: '' });
    const [message, setMessage] = useState(null);

    const getFormattedDate = (separator = '') => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return [year, month, day].join(separator);
    };

    const generateOutputs = useCallback(() => {
        const activePrefixes = selectedOntologies.map(key => ontologiesDb[key]).filter(Boolean);
        const prefixLines = activePrefixes.map(p => `@prefix ${p.prefix}: <${p.uri}> .`).join('\n');
        const agentTypes = agentTypeTemplates[agentType].types.join(' , ');
        const propertyLines = properties.filter(p => p.prefix && p.property && p.value).map(p => {
            const value = p.type === 'uri' ? `<${p.value}>` : `"${p.value.replace(/"/g, '\\"')}"`;
            return `    ${p.prefix}:${p.property} ${value} ;`;
        }).join('\n');
        const trustLines = trusts.filter(t => t.value).map(t => {
            const trustedAdpUrl = `https://${t.value}/.well-known/adp#this`;
            return `    adp:trusts <${trustedAdpUrl}> ;`;
        }).join('\n');
        
        const creationDate = getFormattedDate('-');
        const dateLine = `    dcterms:created "${creationDate}"^^xsd:date ;`;

        const fullRdf = `${prefixLines}\n\n<#this>\n    a ${agentTypes} ;\n    schema:domain "${domainName}" ;\n${dateLine}\n${propertyLines}\n${trustLines}\n.`;
        setRdfOutput(fullRdf.replace(/;\s*\n\./, ' .'));
        
        if (userProvidedCid) {
            const fileUrl = `https://ipfs.io/ipfs/${userProvidedCid}`;
            setDnsRecord({
                type: 'TXT',
                name: '_adp',
                content: `"adp:signer <${fileUrl}#this> ."`
            });
        } else {
            setDnsRecord({ type: 'TXT', name: '_adp', content: 'Enter an IPFS CID to generate the full record.' });
        }
    }, [properties, domainName, agentType, trusts, selectedOntologies, ontologiesDb, userProvidedCid]);

    useEffect(() => {
        generateOutputs();
    }, [generateOutputs]);

    const handleAgentTypeChange = (newType) => {
        setAgentType(newType);
        setProperties(agentTypeTemplates[newType].properties);
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleCopy = (text, successMessage) => {
        navigator.clipboard.writeText(text).then(() => showMessage(successMessage, 'success')).catch(() => showMessage('Failed to copy text.', 'error'));
    };
    
    const handleDownload = () => {
        const fileName = `${getFormattedDate()}_adp.ttl`;
        const blob = new Blob([rdfOutput], { type: 'text/turtle;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage(`File '${fileName}' download started!`);
    };

    const handlePropertyChange = (id, field, value) => {
        setProperties(props => props.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleAddProperty = () => {
        setProperties(props => [...props, { id: Date.now(), prefix: 'adp', property: '', value: '', type: 'literal' }]);
    };

    const handleRemoveProperty = (id) => {
        setProperties(props => props.filter(p => p.id !== id));
    };

    const handleTrustChange = (id, value) => {
        setTrusts(current => current.map(t => t.id === id ? { ...t, value } : t));
    };

    const handleAddTrust = () => {
        setTrusts(current => [...current, { id: Date.now(), value: '' }]);
    };

    const handleRemoveTrust = (id) => {
        setTrusts(current => current.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-12">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Step 1: Set Your Domain</h2>
                <Input label="Domain Name" value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="your-domain.com" />
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Step 2: Choose Agent Type</h2>
                <Select label="Select a template for your agent" value={agentType} onChange={e => handleAgentTypeChange(e.target.value)}>
                    <option value="naturalPerson">Natural Person</option>
                    <option value="organization">Organization / Business</option>
                    <option value="aiAgent">AI Agent / Service</option>
                    <option value="humanitarian">Humanitarian Service</option>
                    <option value="adultWebsite">Adult Content Website</option>
                </Select>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Step 3: Define Agent Properties</h2>
                <div className="space-y-3 p-4 bg-gray-800/50 rounded-md">
                    {properties.map(prop => {
                        const vocabListId = `vocab-list-${prop.id}`;
                        const activeVocab = ontologiesDb[prop.prefix]?.terms || [];
                        return (
                            <div key={prop.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                                <datalist id={vocabListId}>
                                    {activeVocab.map(term => <option key={term} value={term} />)}
                                </datalist>
                                <div className="md:col-span-3">
                                    <Select label="Prefix" value={prop.prefix} onChange={e => handlePropertyChange(prop.id, 'prefix', e.target.value)}>
                                        {selectedOntologies.map(key => <option key={key} value={ontologiesDb[key].prefix}>{ontologiesDb[key].prefix}</option>)}
                                    </Select>
                                </div>
                                <div className="md:col-span-4"><Input label="Property" value={prop.property} onChange={e => handlePropertyChange(prop.id, 'property', e.target.value)} listId={vocabListId} /></div>
                                <div className="md:col-span-4"><Input label="Value" value={prop.value} onChange={e => handlePropertyChange(prop.id, 'value', e.target.value)} /></div>
                                <div className="md:col-span-1"><Button variant="secondary" onClick={() => handleRemoveProperty(prop.id)} className="w-full h-10">&times;</Button></div>
                            </div>
                        )
                    })}
                    <Button onClick={handleAddProperty}>Add Custom Property</Button>
                </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-teal-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-teal-300">Step 4: Establish Web of Trust (Optional)</h2>
                <p className="text-gray-400 text-sm mb-4">Add the domain names of other agents you trust to vouch for them.</p>
                <div className="space-y-3 p-4 bg-gray-800/50 rounded-md">
                    {trusts.map(trust => (
                        <div key={trust.id} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-11"><Input label="Trusted Domain Name" value={trust.value} onChange={e => handleTrustChange(trust.id, e.target.value)} placeholder="another-domain.com" /></div>
                            <div className="col-span-1"><Button variant="secondary" onClick={() => handleRemoveTrust(trust.id)} className="w-full h-10">&times;</Button></div>
                        </div>
                    ))}
                    <Button onClick={handleAddTrust} variant="secondary">Add Trusted Agent</Button>
                </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-green-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-green-300">Step 5: Generate & Upload File</h2>
                <p className="text-gray-400 mb-4">Download the generated `adp.ttl` file and upload it to your preferred IPFS pinning service or your own node.</p>
                <div className="relative">
                    <pre className="bg-gray-900 text-green-300 p-4 rounded-md overflow-x-auto h-80 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        <code>{rdfOutput}</code>
                    </pre>
                </div>
                <div className="mt-4 flex space-x-4">
                    <Button onClick={() => handleCopy(rdfOutput, 'RDF copied to clipboard!')}>Copy RDF</Button>
                    <Button onClick={handleDownload} variant="secondary">Download File</Button>
                </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-purple-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-purple-300">Step 6: Provide IPFS CID</h2>
                <p className="text-gray-400 mb-4">Now its time to upload your file to IPFS.  If you don't already have IPFS, here is a <a href="https://docs.ipfs.tech/install/ipfs-desktop/">link to the IPFS Desktop App</a>. After uploading your file to IPFS, paste the Content ID (CID) below to generate your DNS record.</p>
                <Input label="IPFS Content ID (CID)" value={userProvidedCid} onChange={e => setUserProvidedCid(e.target.value)} placeholder="Qm..." />
            </div>
            {userProvidedCid && (
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-yellow-500/30">
                    <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Step 7: Update DNS</h2>
                    <p className="text-gray-400 mb-4">Add the following TXT record to your domain's DNS settings. The values are separated for easy copying into your DNS provider's interface.</p>
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-1/4"><Input label="Type" value={dnsRecord.type} readOnly={true} /></div>
                            <div className="w-1/4"><Input label="Name" value={dnsRecord.name} readOnly={true} /></div>
                            <div className="w-2/4 flex-grow"><Input label="Content" value={dnsRecord.content} readOnly={true} /></div>
                            <div className="self-end"><Button onClick={() => handleCopy(dnsRecord.content, 'Content Copied!')} variant="secondary" className="h-10">Copy</Button></div>
                        </div>
                    </div>
                </div>
            )}
             {message && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-2xl text-white ${
                    message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}

function CheckerView() {
    const [domain, setDomain] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, found, notFound, error
    const [adpContent, setAdpContent] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleCheckDomain = async () => {
        if (!domain) return;
        setStatus('loading');
        setAdpContent('');
        setErrorMessage('');

        try {
            const dnsResponse = await fetch(`https://dns.google/resolve?name=_adp.${domain}&type=TXT`);
            const dnsData = await dnsResponse.json();

            if (dnsData.Status !== 0 || !dnsData.Answer) {
                throw new Error('DNS record not found or query failed.');
            }

            const txtRecord = dnsData.Answer[0].data.replace(/"/g, '');
            const urlMatch = txtRecord.match(/adp:signer\s*<([^>]+)>/);
            if (!urlMatch) {
                throw new Error('Could not find a valid adp:signer in the TXT record.');
            }
            const adpUrl = urlMatch[1];

            const cidMatch = adpUrl.match(/ipfs\/(Qm[a-zA-Z0-9]{44})/);
            if (!cidMatch) {
                throw new Error('Could not extract a valid IPFS CID from the ADP URL.');
            }
            const cid = cidMatch[1];
            const ipfsGatewayUrl = `https://ipfs.io/ipfs/${cid}`;

            const ipfsResponse = await fetch(ipfsGatewayUrl);
            if (!ipfsResponse.ok) {
                throw new Error(`Failed to fetch from IPFS gateway (status: ${ipfsResponse.status})`);
            }
            const content = await ipfsResponse.text();
            setAdpContent(content);
            setStatus('found');

        } catch (error) {
            console.error("ADP Check Error:", error);
            setErrorMessage(error.message);
            setStatus('error');
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-blue-500/30">
                <h2 className="text-2xl font-semibold mb-4 text-blue-300">Check a Domain's ADP Record</h2>
                <div className="flex space-x-4">
                    <div className="flex-grow">
                        <Input label="Domain Name to Check" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
                    </div>
                    <Button onClick={handleCheckDomain} disabled={status === 'loading'} className="self-end">
                        {status === 'loading' ? 'Checking...' : 'Check Domain'}
                    </Button>
                </div>
            </div>

            {status !== 'idle' && (
                 <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    {status === 'loading' && <p className="text-center text-gray-400">Loading...</p>}
                    {status === 'found' && (
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-green-300">ADP Record Found!</h3>
                             <pre className="bg-gray-800 text-green-300 p-4 rounded-md overflow-x-auto h-96 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                <code>{adpContent}</code>
                            </pre>
                        </div>
                    )}
                     {(status === 'notFound' || status === 'error') && (
                         <div>
                            <h3 className="text-2xl font-semibold mb-4 text-red-400">No Record Found</h3>
                            <p className="text-gray-400">{errorMessage || "Could not find a valid ADP record for this domain."}</p>
                        </div>
                     )}
                 </div>
            )}
        </div>
    );
}


function App() {
    const [activeTab, setActiveTab] = useState('create');

    return (
        <div className="bg-gray-800 text-white min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-5xl font-bold text-blue-400">ADP Utility v0.1</h1>
                    <p className="text-gray-400 mt-2 text-lg">Create and verify Agent Discovery Protocol files. <a href="https://github.com/WebCivics/IPFS-ADP/">see on GitHub</a></p>
                </header>

                <div className="border-b border-gray-700 mb-8">
                    <nav className="-mb-px flex justify-center space-x-4">
                        <TabButton onClick={() => setActiveTab('create')} isActive={activeTab === 'create'}>Create</TabButton>
                        <TabButton onClick={() => setActiveTab('check')} isActive={activeTab === 'check'}>Check</TabButton>
                    </nav>
                </div>
                
                {activeTab === 'create' && <CreatorView />}
                {activeTab === 'check' && <CheckerView />}

            </div>
        </div>
    );
}

export default App;